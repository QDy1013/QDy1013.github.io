---
title: 普通 RNN 语音识别完整源码
date: 2026-10-31 09:59:00
permalink: 2026/10/31/rnn-asr-source/
categories:
  - 语音识别
tags:
  - Python
  - PyTorch
  - RNN
  - ASR
  - 代码学习
---

以下文件按数据、模型、训练和运行的顺序展示。正文讲解见 [完整流程](/2026/10/31/rnn-asr-guide/)，也可 [下载源码 ZIP](/downloads/rnn-asr-learning.zip)。

<!-- more -->


## data.py 数据读入与 Fbank

```python
"""AISHELL、Fbank 和字符标签；支持小样本内存缓存与全量磁盘缓存。"""
from __future__ import annotations  # 延迟处理类型提示，让类型说明不必在函数定义时立即求值。

import hashlib  # 计算数据配置的 SHA-256 签名，用于判断缓存是否匹配。
import json  # 读写 JSON 格式的配置记录、词表和统计结果。
import random  # 按指定随机种子打乱样本编号，便于复现样本选择。
import wave  # 读取 WAV 音频，并检查采样率、声道数等信息。
import shutil  # 复制已有缓存中的词表和数据清单文件。
from pathlib import Path  # 导入 Path 类，用来拼接路径、检查文件和读写文本。

import numpy as np  # 导入 NumPy 并简写为 np；这里用它把音频字节解释为数字数组。
import torch  # 导入 PyTorch；这里用它创建张量、保存和读取特征等。
from torch.nn.utils.rnn import pad_sequence  # 导入补齐工具，将不同长度的序列补成同一长度。
from torch.utils.data import Dataset  # 导入数据集基类，供后面的 SpeechDataset 继承。
import torchaudio  # 导入音频工具包；这里用它从声音波形中提取 Fbank 特征。

# 词表中前四个编号留给特殊符号：补齐、开始、结束、词表外字符。
# 编号与 SPECIAL 中的位置一一对应，普通汉字从编号 4 开始。
PAD, BOS, EOS, UNK = 0, 1, 2, 3
SPECIAL = ["<pad>", "<bos>", "<eos>", "<unk>"]


# 第一步：读取清单。每行按第一次空白分成“语音编号”和“剩余内容”，
# 所以内容中的空格不会导致一行被拆成多个字段。返回 {编号: 路径或文字}。
def read_mapping(path: Path) -> dict[str, str]:
    result = {}  # 收集编号与内容的对应关系。
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.split(maxsplit=1)  # 最多拆一次；空行或只有编号的行会被跳过。
        if len(parts) == 2:
            if parts[0] in result:
                raise ValueError(f"Duplicate utterance ID in {path}: {parts[0]}")
            result[parts[0]] = parts[1]
    return result


# 第二步：选择一个数据划分。split 是 train、dev 或 test；
# count 为 0 表示选择全部符合条件的样本，否则最多选指定数量。
def select_split(config: dict, split: str, count: int, seed: int) -> list[dict]:
    directory = Path(config["data_dir"]) / split
    if not (directory / "wav.scp").is_file():
        raise FileNotFoundError(f"找不到 {directory / 'wav.scp'}。请指定已有 AISHELL recipe 的 data 目录。")
    # 两份清单分别是“编号 -> 音频路径”和“编号 -> 正确文字”。
    paths = read_mapping(directory / "wav.scp")
    texts = read_mapping(directory / "text")
    if config.get("require_complete") and set(paths) != set(texts):
        raise ValueError(f"{split} 的音频与文字 ID 不完全对应，请检查数据准备。")
    # 只保留两份清单都有的编号；先排序再固定种子打乱，保证选择可复现。
    ids = sorted(set(paths) & set(texts))
    random.Random(seed).shuffle(ids)
    selected = []
    for uid in ids:
        text = "".join(texts[uid].split())  # 去掉文字中的空白，例如“你 好”变成“你好”。
        if not config["min_chars"] <= len(text) <= config["max_chars"]:
            continue
        path = Path(paths[uid])
        if not path.is_absolute():
            path = directory / path
        if not path.is_file():
            continue
        # 先检查 WAV 的采样率、声道、采样宽度和时长；此处还没有提取特征。
        with wave.open(str(path), "rb") as audio:
            rate = audio.getframerate()
            duration = audio.getnframes() / rate
            supported = audio.getnchannels() == 1 and audio.getsampwidth() == 2
        if rate != config["sample_rate"] or not supported:
            continue
        if not config["min_seconds"] <= duration <= config["max_seconds"]:
            continue
        # 把一条合格语音的元信息装进字典；speaker 使用音频父目录名。
        selected.append({"id": uid, "wav": str(path.resolve()), "text": text,
                         "seconds": duration, "speaker": path.parent.name})
        if count and len(selected) == count:
            return selected
    if count == 0 and selected:
        if config.get("require_complete") and len(selected) != len(ids):
            raise ValueError(f"{split} 需要全量有效数据，但只有 {len(selected)}/{len(ids)} 条通过格式、长度和文件检查。")
        print(f"selected {split}: {len(selected)}/{len(ids)} utterances", flush=True)
        return selected
    raise RuntimeError(f"{split} 符合条件的样本不足：期望 {count}，实际 {len(selected)}")


# 第三步：把一条 WAV 变成 Fbank 张量，形状通常是 [帧数, 频带数]。
# 例如 80 个频带意味着每个时间帧用 80 个数表示；帧数随录音长度变化。
def fbank_for_file(path: str, config: dict) -> torch.Tensor:
    """AISHELL 为 16 kHz、单声道、16-bit PCM，使用标准库读取，无新音频依赖。"""
    with wave.open(path, "rb") as audio:
        if audio.getframerate() != config["sample_rate"]:
            raise ValueError("音频采样率与配置不同；本教学版不会静默重采样。")
        if audio.getnchannels() != 1 or audio.getsampwidth() != 2:
            raise ValueError("本教学版要求单声道 16-bit PCM WAV。")
        # 将文件里的字节按小端 16 位有符号整数解释；copy 得到可独立使用的数组。
        pcm = np.frombuffer(audio.readframes(audio.getnframes()), dtype="<i2").copy()
    waveform = torch.from_numpy(pcm).float().unsqueeze(0)  # [采样点数] -> [1, 采样点数]，1 是单声道。
    # 按配置分帧并计算梅尔滤波器组特征；这里返回特征，不会训练模型。
    return torchaudio.compliance.kaldi.fbank(
        waveform, sample_frequency=config["sample_rate"],
        num_mel_bins=config["num_mel_bins"], frame_length=config["frame_length"],
        frame_shift=config["frame_shift"], dither=0.0, energy_floor=0.0,
    )


# 为影响数据选择和特征提取的配置生成签名，用于检查缓存能否复用。
def cache_signature(config: dict) -> str:
    keys = ["seed", "data_dir", "train_size", "dev_size", "test_size", "min_seconds",
            "max_seconds", "min_chars", "max_chars", "sample_rate", "num_mel_bins",
            "frame_length", "frame_shift"]
    source = {k: config[k] for k in keys}
    # 小实验的旧签名保持兼容；全量实验使用独立的磁盘缓存签名。
    if config.get("feature_storage", "memory") != "memory":
        source["feature_storage"] = config["feature_storage"]
    if config.get("require_complete"):
        source["require_complete"] = True
    return hashlib.sha256(json.dumps(source, sort_keys=True).encode()).hexdigest()


# 数据准备总入口：检查缓存 -> 选择样本 -> 建词表 -> 提取特征 -> 保存结果。
# 返回的 payload 包含词表、三个划分、训练集归一化统计和数据统计。
def prepare_dataset(config: dict, output_dir: Path) -> dict:
    # 如果指定共享缓存，检查签名后复用已有划分、词表、统计和特征。
    if config.get("shared_data_cache"):
        source = Path(config["shared_data_cache"]).resolve()
        if source == output_dir.resolve():
            raise ValueError("共享缓存来源与当前输出目录相同，请移除 shared_data_cache。")
        payload = torch.load(source / "data.pt", map_location="cpu", weights_only=False)
        if payload["signature"] != cache_signature(config):
            raise ValueError("共享缓存与本次数据配置不同，不能混用数据划分或词表。")
        # 共享实际特征文件与统计；只复制小型清单，避免重算或复制整份Fbank。
        for name in ["vocab.json", "data_statistics.json", "train.jsonl", "dev.jsonl", "test.jsonl"]:
            shutil.copy2(source / name, output_dir / name)
        (output_dir / "data_source.json").write_text(json.dumps({
            "source_cache": str(source / "data.pt"), "data_signature": payload["signature"],
            "shared": ["train/dev/test", "vocabulary", "training CMVN", "Fbank files"]}, indent=2), encoding="utf-8")
        print(f"Reusing existing data, vocabulary and Fbank cache: {source}", flush=True)
        return payload
    # 没有共享缓存时，先检查当前实验自己的数据缓存。
    cache = output_dir / "data.pt"
    signature = cache_signature(config)
    disk_features = config.get("feature_storage", "memory") == "disk"
    signature_file = output_dir / "preparation_signature.txt"
    if signature_file.is_file() and signature_file.read_text() != signature:
        raise ValueError("该目录已有不同设置的数据准备记录，请换一个输出目录。")
    if cache.is_file():
        payload = torch.load(cache, map_location="cpu", weights_only=False)
        if payload["signature"] != signature:
            raise ValueError("数据配置与现有缓存不同，请使用新的输出目录，保留旧实验。")
        return payload

    signature_file.write_text(signature)
    (output_dir / "status.json").write_text(json.dumps({"status": "preparing", "signature": signature}), encoding="utf-8")

    # 使用不同随机种子分别选择训练、验证、测试样本。
    splits = {name: select_split(config, name, config[f"{name}_size"], config["seed"] + i)
              for i, name in enumerate(["train", "dev", "test"])}
    # 检查划分之间没有重复语音编号或重复说话人。
    for a, b in [("train", "dev"), ("train", "test"), ("dev", "test")]:
        if {s["id"] for s in splits[a]} & {s["id"] for s in splits[b]}:
            raise ValueError("训练、验证与测试 utterance ID 重叠。")
        if {s["speaker"] for s in splits[a]} & {s["speaker"] for s in splits[b]}:
            raise ValueError("AISHELL 三个划分的说话人重叠，请检查数据目录。")

    # 只根据训练文字建立字符词表，避免使用验证和测试文字构建词表。
    vocab = SPECIAL + sorted({ch for sample in splits["train"] for ch in sample["text"]})
    stoi = {ch: i for i, ch in enumerate(vocab)}  # string-to-index：字符 -> 整数编号。
    # 累计训练集每个频带的总和、平方和及帧数，用来计算均值和标准差。
    feature_sum = torch.zeros(config["num_mel_bins"], dtype=torch.float64)
    feature_sumsq = torch.zeros_like(feature_sum)
    frame_count = 0
    stats = {}
    for split, samples in splits.items():
        if disk_features:
            (output_dir / "features" / split).mkdir(parents=True, exist_ok=True)
        unknown = 0
        characters = 0
        # 逐条处理，磁盘模式不会把全部特征同时保存在内存。
        for j, sample in enumerate(samples):
            if disk_features:
                # 每条只在首次使用时提取一次；中断后可复用已完成的文件。
                feature_path = output_dir / "features" / split / f"{sample['id']}.pt"
                if feature_path.is_file():
                    features = torch.load(feature_path, map_location="cpu", weights_only=True)
                else:
                    features = fbank_for_file(sample["wav"], config)
                    temporary = feature_path.with_suffix(".tmp")
                    torch.save(features, temporary)
                    temporary.replace(feature_path)
                sample["feature_path"] = str(feature_path)
            else:
                features = fbank_for_file(sample["wav"], config)
                sample["features"] = features
            # 把每个字转成词表编号；没见过的字用 UNK，不会直接删除。
            sample["tokens"] = [stoi.get(ch, UNK) for ch in sample["text"]]
            characters += len(sample["tokens"])
            unknown += sample["tokens"].count(UNK)
            # 归一化统计仅由训练集计算；验证、测试集不能参与统计。
            if split == "train":
                f = features.double()
                feature_sum += f.sum(0)
                feature_sumsq += f.square().sum(0)
                frame_count += f.size(0)
            if (j+1) % (1000 if disk_features else 32) == 0 or j+1 == len(samples):
                print(f"prepare {split}: {j+1}/{len(samples)}", flush=True)
                (output_dir / "status.json").write_text(json.dumps({
                    "status": "preparing", "split": split, "prepared": j+1,
                    "total": len(samples)}, ensure_ascii=False), encoding="utf-8")
        stats[split] = {"utterances": len(samples), "characters": characters,
                        "seconds": sum(s["seconds"] for s in samples),
                        "unknown_characters": unknown,
                        "unknown_rate": unknown / max(1, characters)}
    # 每个频带分别计算均值与标准差：方差 = 平方的均值 - 均值的平方。
    # clamp_min 防止数值误差或极小方差导致开方、除法不稳定。
    mean = (feature_sum / frame_count).float()
    variance = feature_sumsq / frame_count - (feature_sum/frame_count).square()
    std = variance.clamp_min(1e-5).sqrt().float()
    # 内存模式现在就归一化；磁盘模式保留原特征，在 __getitem__ 读取时归一化。
    if not disk_features:
        for samples in splits.values():
            for sample in samples:
                sample["features"] = (sample["features"] - mean) / std
    # 除完整缓存 data.pt 外，也输出方便人工查看的词表、清单和统计。
    payload = {"version": 2 if disk_features else 1, "signature": signature, "vocab": vocab, "splits": splits,
               "cmvn_mean": mean, "cmvn_std": std, "statistics": stats}
    (output_dir / "vocab.json").write_text(json.dumps(vocab, ensure_ascii=False, indent=2), encoding="utf-8")
    for split, samples in splits.items():
        plain = [{k: v for k, v in s.items() if k not in {"features", "tokens"}} for s in samples]
        (output_dir / f"{split}.jsonl").write_text(
            "\n".join(json.dumps(s, ensure_ascii=False) for s in plain)+"\n", encoding="utf-8")
    (output_dir / "data_statistics.json").write_text(
        json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary_cache = cache.with_suffix(".tmp")
    torch.save(payload, temporary_cache)
    temporary_cache.replace(cache)
    return payload


def spec_augment(features, setting):  # SpecAugment：在归一化后的[T,80]特征上随机遮挡频带和时间段。
    frames, bins = features.shape  # T是10ms原始帧数，bins是80个梅尔频带；此时尚未4帧拼接。
    masked = features.clone()  # 复制一份，绝不修改磁盘缓存载入的原张量。
    for _ in range(setting.get("num_f_mask", 2)):  # 频率遮挡条数，默认2条。
        width = int(torch.randint(0, setting.get("max_f", 10) + 1, ()))  # 每条宽0～max_f个频带；用torch随机数，各读取进程种子不同。
        start = int(torch.randint(0, bins - width + 1, ()))  # 随机起始频带，保证不越界。
        masked[:, start:start + width] = 0  # 置0即CMVN后的均值，相当于“这里没有信息”。
    limit = min(setting.get("max_t", 50), int(frames * setting.get("max_t_ratio", 0.2)))  # 时间遮挡不超过max_t帧，也不超过全长的一定比例，防止短语音被整段盖掉。
    for _ in range(setting.get("num_t_mask", 2)):  # 时间遮挡条数，默认2条。
        width = int(torch.randint(0, limit + 1, ()))  # 每条长0～limit帧。
        start = int(torch.randint(0, frames - width + 1, ()))  # 随机起始帧。
        masked[start:start + width, :] = 0  # 该时间段所有频带都置0。
    return masked  # 返回遮挡后的新特征；验证和测试集不会调用本函数。


# Dataset 负责按下标取出一条样本；DataLoader 会调用它组成批次。
class SpeechDataset(Dataset):
    def __init__(self, samples: list[dict], cmvn_mean=None, cmvn_std=None, augment=None):
        self.samples = samples
        self.mean, self.std = cmvn_mean, cmvn_std
        self.augment = augment  # SpecAugment设置；None表示不增强（验证、测试、训练探针和旧实验）。

    def __len__(self):
        return len(self.samples)  # 数据集中共有多少条样本。

    def __getitem__(self, index):
        sample = self.samples[index]
        if "features" in sample:  # 内存模式：特征已载入并完成归一化。
            return sample
        # 只把当前这条语音的特征载入内存，随后由 collate 拼成一批。
        features = torch.load(sample["feature_path"], map_location="cpu", weights_only=True)
        features = (features-self.mean) / self.std  # 先做CMVN归一化，遮挡值0才等于均值。
        if self.augment:  # 只有训练loader会传入设置。
            features = spec_augment(features, self.augment)  # 每次读取都重新随机，同一语音每轮遮挡位置不同。
        return {**sample, "features": features}  # 复制样本字段并加入本次读出的特征。


# 将多条长度不等的样本拼成一批。B 是批大小，T 是本批最长帧数，F 是频带数。
# pad_sequence 在较短序列末尾补齐；lengths 保留每条声音补齐前的真实长度。
def collate(samples: list[dict]) -> dict:
    features = pad_sequence([s["features"] for s in samples], batch_first=True)  # [B,T,F]。
    lengths = torch.tensor([s["features"].size(0) for s in samples], dtype=torch.long)  # [B]。
    # 训练时输入前一个正确字符；当前字符始终在目标一侧，避免把答案直接传给当前预测。
    # 例：文字“你好”，输入是 [BOS, 你, 好]，目标是 [你, 好, EOS]。
    # 短文字用 PAD 补到同一长度；后续损失计算会忽略 PAD。
    decoder_inputs = pad_sequence([torch.tensor([BOS]+s["tokens"]) for s in samples],
                                  batch_first=True, padding_value=PAD)
    targets = pad_sequence([torch.tensor(s["tokens"]+[EOS]) for s in samples],
                           batch_first=True, padding_value=PAD)
    # 声音已经合成 features；这里只保留识别评测所需的样本信息。
    # 避免把每条原始特征再次从读取进程传到主进程，减少共享内存与通信开销。
    metadata = [{k: v for k, v in sample.items() if k != "features"} for sample in samples]
    return {"features": features, "lengths": lengths, "decoder_inputs": decoder_inputs,
            "targets": targets, "samples": metadata}


def collate_sorted(samples: list[dict]) -> dict:  # 只调整同一个有效batch内部的顺序，不跨batch交换样本。
    ordered = sorted(samples, key=lambda sample: sample["features"].size(0), reverse=True)  # 相近长度的语音进入同一显存小块。
    return collate(ordered)  # 保持原来的标签、样本和特征一一对应。


# 把模型预测的编号还原成可阅读的文字：遇到 EOS 停止，跳过 PAD 和 BOS。
# UNK 显示为方框，以提示预测了词表外符号。
def ids_to_text(ids: list[int], vocab: list[str]) -> str:
    result = []
    for token in ids:
        if token == EOS:
            break
        if token in (PAD, BOS):
            continue
        result.append("□" if token == UNK else vocab[token])
    return "".join(result)
```


## model.py 普通 RNN 模型

```python
# 阅读顺序：forward 看整体流程 → __init__ 看有哪些部件 → encode / decode 看两台 RNN → greedy_decode 看实际识别。
# self 表示当前这个模型对象；self.encoder、self.decoder 是保存在模型里的两个独立 RNN。
# config 从 config.json 读取。__init__ 搭建计算部件，训练时才会逐步更新这些部件的参数。
#
# 后面的注释用这些字母描述张量形状。张量可以先理解成一个能放在 CPU / GPU 上的多维数字数组：
# B：这批有几条语音；T：这批补齐后的声音帧数；F：每帧的 Fbank 维度，当前为 80。
# G：每 4 帧拼成一组后的组数；H：RNN 隐藏向量长度，当前为 192；K：RNN 层数，当前为 1。
# U：解码器这次处理的文字步数；E：一个文字 token 的嵌入维度，当前为 128。
# V：词表大小，即可预测的符号种类数；刚跑完的小实验 V=638，其中也包括特殊符号。
# [B, T, 80] 表示 B 条语音、每条 T 帧、每帧 80 个数字，不是把 B×T×80 个数当作一条向量。
#
"""普通 tanh RNN 编码器—解码器：固定长度状态，没有注意力、LSTM、GRU 或 CTC。"""  # 本文件的用途说明。
from __future__ import annotations  # 延迟处理类型提示；类型提示用来说明参数类型，不是网络计算。

import torch  # 导入 PyTorch，用它创建数字张量、执行计算并支持训练所需的自动求导。
from torch import nn  # nn 提供神经网络部件，例如 RNN、线性层和文字嵌入层。
from torch.nn import functional as F  # 给 functional 起别名 F；本文件会用它的 pad 补零函数。
from torch.nn.utils.rnn import pack_padded_sequence  # 按真实语音长度打包，避免 RNN 把补齐帧当成声音继续读。

from data import BOS, EOS, PAD  # 从 data.py 导入起始符、结束符、补齐符的整数编号，不是普通汉字。


class RNNEncoderDecoder(nn.Module):  # 定义整个模型；继承 nn.Module 后，PyTorch 才能统一管理这些网络部件和参数。
    def __init__(self, config: dict, vocab_size: int):  # 创建模型时执行；config 是配置字典，vocab_size 是词表大小。
        super().__init__()  # 先初始化 nn.Module，后面添加的层才能被正确登记和训练。
        self.stack = config["stack_frames"]  # 读取拼帧数量；当前为 4，即把相邻 4 个 Fbank 向量拼成一组。
        self.hidden_size = config["hidden_size"]  # 读取隐藏向量长度 H=192；这个数字不是汉字种类数。
        self.num_layers = config["num_layers"]  # 读取 RNN 层数 K=1；一层内部也会沿时间反复更新隐藏状态。

        self.input_projection = nn.Linear(  # 创建可训练的线性层：对每组声音特征重新加权组合。
            config["num_mel_bins"] * self.stack,  # 输入长度：80 维/帧 × 4 帧 = 320 个数字。
            self.hidden_size,  # 输出长度：192 个数字；它们将成为编码器每一步的输入。
        )  # 到这里完成部件定义；真正的投影计算发生在 encode 中。
        self.encoder = nn.RNN(  # 创建第一台普通 RNN，负责按顺序读声音；nn.RNN 内部已经实现了时间循环。
            self.hidden_size,  # 第一个参数是每步输入长度：192，而不是尚未整理过的 80 维 Fbank。
            self.hidden_size,  # 第二个参数是隐藏状态长度：每读一步，更新一个 192 维的记忆向量。
            num_layers=self.num_layers,  # 使用 1 层 RNN；多层时，各层分别维护自己的隐藏状态。
            nonlinearity="tanh", batch_first=True,  # tanh 是非线性变换；batch_first 表示输入按 [批次, 时间, 特征] 排列。
        )  # 这个 RNN 保存为 self.encoder，供 encode 调用。
        self.embedding = nn.Embedding(  # 创建文字查表层：把整数编号的 token 换成可训练的数字向量。
            vocab_size, config["embedding_size"], padding_idx=PAD,  # 当前是 638 个符号、每个 128 维；补齐符这一行不更新梯度。
        )  # 这是文字的嵌入表，接收文字编号；声音的 Fbank 不会经过这张表。
        self.decoder = nn.RNN(  # 创建第二台普通 RNN，负责根据声音信息和文字上下文逐步生成文字。
            config["embedding_size"] + self.hidden_size,  # 每步输入长度：前一个字的 128 维嵌入 + 固定 c 的 192 维 = 320。
            self.hidden_size,  # 解码器自己的隐藏状态长度也是 192，但它会在输出文字的过程中不断更新。
            num_layers=self.num_layers, nonlinearity="tanh", batch_first=True,  # 同样使用 1 层 tanh RNN，批次维放最前面。
        )  # 编码器和解码器是两个不同的对象，它们的可训练参数也各自独立。
        self.output_projection = nn.Linear(self.hidden_size, vocab_size)  # 把解码器的 192 维状态变成 V 个分数，每个符号一个分数。

    # encode 的输入已经是 data.py 算好并归一化的 Fbank；每条录音长度不同，所以还要传真实帧数 lengths。
    def encode(self, features: torch.Tensor, lengths: torch.Tensor):  # features 是 [B,T,80]；lengths 是 [B]，记录每条语音有几帧。
        batch, time, bins = features.shape  # 拆出数组的三个维度：B 条语音、补齐到 T 帧、每帧 F=80 维。
        pad = (-time) % self.stack  # 算出再补多少帧才能凑成 4 的倍数；例如 T=5 要补 3 帧，T=8 则补 0 帧。
        stacked = F.pad(features, (0, 0, 0, pad)).reshape(  # 先在时间末尾补零，再把相邻 4 帧归成一组。
            batch, -1, bins * self.stack,  # 变成 [B,G,320]；reshape 中的 -1 表示让 PyTorch 自动计算组数 G。
        )  # 只是把相邻帧的数字拼在一起，这一步本身不学习参数。

        # 一批录音会补到相同长度。尤其最后一组可能只有一两帧真实声音，其余位置必须清零。
        positions = torch.arange(  # 创建时间位置编号 0、1、2……，用于判断每条录音哪些帧是真实的。
            stacked.size(1) * self.stack, device=features.device,  # 一共有 G×4 个帧位置；device 保证编号与声音张量在同一设备上。
        )  # positions 的形状是 [G×4]。
        frame_mask = positions.unsqueeze(0) < lengths.to(features.device).unsqueeze(1)  # 比较位置和真实帧数，得到 [B,G×4] 的真/假表。
        stacked = stacked.reshape(batch, -1, self.stack, bins)  # 从 [B,G,320] 拆成 [B,G,4,80]，以便逐帧清理补齐位置。
        stacked = stacked * frame_mask.reshape(batch, -1, self.stack, 1)  # 真实帧乘 1，补齐帧乘 0；末尾的 1 让同一标记作用于 80 个特征。
        stacked = stacked.reshape(batch, -1, self.stack * bins)  # 再合回 [B,G,320]，让每组恢复成一个长向量。
        projected = torch.tanh(self.input_projection(stacked))  # 每组 320 维先线性变为 192 维，再经 tanh，得到 [B,G,192]。
        down_lengths = (lengths + self.stack - 1) // self.stack  # 每条语音的真实组数，按向上取整计算；例如 5 帧变成 2 组。
        packed = pack_padded_sequence(  # 打包时告诉 RNN 每条语音何时结束，使它跳过完整的补齐组。
            projected, down_lengths.cpu(), batch_first=True,  # 输入声音组和真实组数；这个打包接口要求长度数组放在 CPU。
            enforce_sorted=False,  # 允许这一批录音不按长度排序，打包函数会负责处理。
        )  # packed 仍承载声音特征，只是换成了适合不等长序列的包装形式。
        _, hidden = self.encoder(packed)  # RNN 从零初始状态读完整段声音；忽略逐步输出，只保留各层的最终状态 [K,B,192]。
        context = hidden[-1]  # 取最后一层的最终状态，得到 [B,192] 的 c；这里的 -1 指最后一层，hidden 本身已是最终时刻的状态。
        return context, hidden  # 返回固定声音信息 c，以及用来初始化解码器的各层状态；当前 K=1，二者包含同一份最终记忆。

    # c 在整次解码中固定；hidden 在第一次调用时来自编码器，后续调用时来自解码器上一步。
    def decode(self, previous_tokens, context, hidden):  # 接收前一个字的编号 [B,U]、固定声音向量 [B,192]、循环状态 [K,B,192]。
        embedded = self.embedding(previous_tokens)  # 文字编号查表，得到 [B,U,128]；神经网络后续计算使用这些数字，而非汉字字符串。
        repeated_context = context.unsqueeze(1).expand(  # 给 c 加上文字时间维，再让每个文字位置都能读取同一个 c。
            -1, embedded.size(1), -1,  # 得到 [B,U,192]；expand 中 -1 表示保持原维度，U 是这次要处理的文字步数。
        )  # 这里使用 expand 扩展视图，不是重新编码声音，也没有挑选某些声音帧。
        inputs = torch.cat([embedded, repeated_context], dim=-1)  # 在最后一维拼接文字与 c：128+192=320，得到 [B,U,320]。
        output, hidden = self.decoder(inputs, hidden)  # 解码器按顺序更新状态；output 是各步状态 [B,U,192]，hidden 是最后状态 [K,B,192]。
        return self.output_projection(output), hidden  # 将各步状态变成 [B,U,V] 的候选符号分数，同时返回更新后的隐藏状态。

    # 训练时，decoder_inputs 是右移后的正确文字。例如输入 [起始符,你,好]，要求分别预测 [你,好,结束符]。
    # 计算 loss、反向传播和更新参数在 train.py 中；forward 负责根据当前参数算出分数。
    def forward(self, features, lengths, decoder_inputs):  # 调用 model(...) 时 PyTorch 会进入这里；也用于验证阶段计算 loss。
        context, hidden = self.encode(features, lengths)  # 先读完整段声音，获得固定 c 与编码器最终状态。
        logits, _ = self.decode(decoder_inputs, context, hidden)  # 用已给定的文字前缀计算各步分数；这里不需要解码器最终状态，故用 _ 忽略。
        return logits  # 返回未经 softmax 的分数 [B,U,V]，交给交叉熵损失计算；此时还不是最终汉字。

    # 真正识别时，没有正确文字可用：先给起始符，再把模型自己刚选出的字送回去，继续预测下一个字。
    @torch.no_grad()  # 识别阶段不记录反向求导过程，节省内存；这行本身不会更新参数。
    def greedy_decode(self, features, lengths, max_steps=48):  # greedy 表示每一步只选最高分符号；最多生成 48 步，避免迟迟不结束。
        context, hidden = self.encode(features, lengths)  # 先编码声音；这个 context 在下面整个循环中始终不变。
        previous = torch.full(  # 为这一批每条语音准备第一个解码输入。
            (features.size(0), 1), BOS, device=features.device, dtype=torch.long,  # [B,1] 中全是起始符编号；long 是嵌入表需要的整数类型。
        )  # previous 是文字编号，不是隐藏向量；下一步会由 embedding 转成文字向量。
        finished = torch.zeros(  # 记录每条语音是否已经生成结束符，初始时都没有结束。
            features.size(0), device=features.device, dtype=torch.bool,  # 得到 [B] 的布尔数组，每个 False 对应一条还在识别的语音。
        )  # 同一批不同语音可以在不同步数结束。
        outputs = []  # 暂存每一步选出的符号编号；列表中的每个元素形状都是 [B]。
        for _ in range(max_steps):  # 最多循环 max_steps 次；_ 表示这里不用循环计数本身。
            logits, hidden = self.decode(previous, context, hidden)  # 用前一个字和固定 c 预测一步，同时把新的隐藏状态留给下一步。
            scores = logits[:, -1].clone()  # 取本次最后一个文字位置的 V 个分数，得到 [B,V]；复制后可安全屏蔽特殊符号。
            scores[:, PAD] = -torch.inf  # 把补齐符分数设成负无穷，确保不会把它当成识别文字选出来。
            scores[:, BOS] = -torch.inf  # 起始符只负责开始解码，也不允许被再次输出；结束符仍然可以被选中。
            token = scores.argmax(-1)  # 每条语音选择分数最高的符号编号，得到 [B]；它可能是一个字，也可能是结束符。
            token = torch.where(finished, torch.full_like(token, EOS), token)  # 已经结束的语音继续保持结束符，其余语音保留本步预测。
            outputs.append(token)  # 记录这一轮每条语音选出的符号编号。
            finished |= token.eq(EOS)  # 本步选中结束符就标记为结束；之前已经结束的标记也保留下来。
            previous = token.unsqueeze(1)  # [B] 变成 [B,1]，把本步预测当作下一步的“前一个字”。
            if finished.all():  # 如果这一批所有语音都已经生成结束符，就不需要继续循环。
                break  # 提前结束循环；尚未全结束时会继续到下一步或达到 48 步上限。
        return torch.stack(outputs, dim=1).cpu().tolist()  # 把各步拼成 [B,生成步数]，移回 CPU，再转成编号列表；data.py 再负责把编号还原成文字。
```


## models.py 模型选择入口

```python
"""按配置选择教学模型；旧检查点未写model_type时默认普通RNN。"""
from model import RNNEncoderDecoder  # 第一阶段的普通RNN模型。
from model_lstm import LSTMEncoderDecoder  # 第二阶段的LSTM模型。
from model_lstm_attention import AttentionLSTMEncoderDecoder  # 第三阶段：每个文字步查询整段声音。
from model_lstm_attention_ctc import JointCTCAttentionLSTM  # 第四阶段：CTC和Attention共享编码器。
from model_transformer_ctc import JointCTCAttentionTransformer  # 第五阶段：Transformer结构对照。


def build_model(config, vocab_size):  # 根据配置创建一个全新模型，不自动读取其他模型的权重。
    kind = config.get("model_type", "rnn")  # 兼容此前已保存的RNN配置。
    choices = {"rnn": RNNEncoderDecoder, "lstm": LSTMEncoderDecoder,
               "lstm_attention": AttentionLSTMEncoderDecoder,
               "lstm_attention_ctc": JointCTCAttentionLSTM,
               "transformer_ctc": JointCTCAttentionTransformer}  # 五个模型使用相同数据和评测入口。
    if kind not in choices:  # 对未知类型直接报错，避免默默选错模型。
        raise ValueError(f"Unknown model_type: {kind}")  # 显示配置中的错误名称。
    return choices[kind](config, vocab_size)  # 创建并返回所选模型。
```


## train.py 完整训练与评测入口

```python
"""运行 RNN、LSTM 固定向量或 LSTM 注意力实验，使用 AISHELL 原始划分。"""
from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path
import random
import time

os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")

import numpy as np
import torch
from torch.nn import functional as F
from torch.utils.data import DataLoader

from data import PAD, SpeechDataset, collate, collate_sorted, ids_to_text, prepare_dataset
from metrics import edit_distance, summarize
from models import build_model
from report import write_report
from training_steps import train_step  # 支持保持有效batch不变的显存小批次计算。


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")


def seed_everything(seed):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False


def loader(samples, batch_size, shuffle=False, data=None, config=None):
    data, config = data or {}, config or {}
    workers = config.get("num_workers", 0)
    augment = config.get("spec_augment") if shuffle else None  # 只有打乱顺序的训练loader做SpecAugment；验证、测试和训练探针都不遮挡。
    return DataLoader(SpeechDataset(samples, data.get("cmvn_mean"), data.get("cmvn_std"), augment),
                      batch_size=batch_size, shuffle=shuffle,
                      collate_fn=collate_sorted if shuffle and config.get("sort_within_batch", False) else collate,  # 只在当前训练有效batch内部按长度排列。
                      num_workers=workers, persistent_workers=workers > 0,
                      pin_memory=config.get("pin_memory", False),
                      **({"multiprocessing_context": "spawn",
                          "prefetch_factor": config.get("prefetch_factor", 2)} if workers else {}))


@torch.no_grad()
def evaluate(model, samples, vocab, device, config, data=None):
    if config.get("model_type") in {"lstm_attention_ctc", "transformer_ctc"}:  # 联合模型同时记录Attention和CTC自由识别结果。
        from evaluation_ctc import evaluate_joint  # 不改变原来三种模型的评测公式。
        return evaluate_joint(model, samples, vocab, device, config, data, loader)  # 主指标仍是Attention CER。
    model.eval()
    rows = []
    total_loss, tokens = 0.0, 0
    for batch in loader(samples, config.get("eval_batch_size", config["batch_size"]), data=data, config=config):
        features = batch["features"].to(device, non_blocking=config.get("pin_memory", False))
        logits = model(features, batch["lengths"], batch["decoder_inputs"].to(device, non_blocking=config.get("pin_memory", False)))
        targets = batch["targets"].to(device, non_blocking=config.get("pin_memory", False))
        total_loss += F.cross_entropy(logits.reshape(-1, len(vocab)), targets.reshape(-1),
                                     ignore_index=PAD, reduction="sum").item()
        tokens += targets.ne(PAD).sum().item()
        # 真正的识别只使用声音，不给模型传参考文字。
        predictions = model.greedy_decode(features, batch["lengths"], config["max_decode_steps"])
        for sample, predicted in zip(batch["samples"], predictions):
            text = ids_to_text(predicted, vocab)
            rows.append({"id": sample["id"], "wav": sample["wav"], "reference": sample["text"],
                         "prediction": text, "edits": edit_distance(sample["text"], text),
                         "unknown_reference_characters": sample["tokens"].count(3)})
    metrics = summarize(rows)
    metrics["loss"] = total_loss/max(1, tokens)
    return metrics, rows


def build_scheduler(optimizer, config):  # 按配置创建学习率调度；旧配置没有lr_schedule时返回None，学习率固定不变。
    setting = config.get("lr_schedule")  # 例如{"type": "noam", "warmup_steps": 1500}。
    if not setting:  # 旧实验：固定学习率。
        return None  # 训练循环据此跳过调度。
    if setting["type"] != "noam":  # 目前只实现Noam，避免拼错类型时悄悄用了固定学习率。
        raise ValueError(f"未知的学习率调度类型：{setting['type']}")  # 明确报错。
    warmup = setting["warmup_steps"]  # warmup步数，按参数更新次数计（每个有效batch一次）。
    if warmup <= 0:  # 防止除零。
        raise ValueError("warmup_steps必须为正。")  # 明确报错。

    def noam(step):  # 返回“峰值学习率的倍数”；LambdaLR用它乘config["learning_rate"]。
        step = step + 1  # LambdaLR从0开始计数；第1次更新对应step=1，避免0次方根。
        return min(step / warmup, (warmup / step) ** 0.5)  # 前warmup步线性升到1，之后按步数的-0.5次方下降。

    return torch.optim.lr_scheduler.LambdaLR(optimizer, noam)  # 构造时即把学习率设为峰值×noam(0)。


def checkpoint_payload(model, optimizer, epoch, config, data, history, best_key, best_epoch, scheduler=None):
    return {"model": model.state_dict(), "optimizer": optimizer.state_dict(),
            "scheduler": scheduler.state_dict() if scheduler is not None else None,  # 调度器已走过的步数；不存的话续训会重新warmup。
            "epoch": epoch, "config": config, "vocab": data["vocab"],
            "cmvn_mean": data["cmvn_mean"], "cmvn_std": data["cmvn_std"],
            "data_signature": data["signature"], "history": history,
            "best_key": best_key, "best_epoch": best_epoch,
            "python_rng": random.getstate(), "numpy_rng": np.random.get_state(),
            "torch_rng": torch.get_rng_state(),
            "cuda_rng": torch.cuda.get_rng_state_all() if torch.cuda.is_available() else []}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, default=Path(__file__).with_name("config.json"))
    parser.add_argument("--output", type=Path, default=Path("/home/qd/asr_learning/rnn_001"))
    parser.add_argument("--data-dir")
    parser.add_argument("--epochs", type=int)
    parser.add_argument("--train-size", type=int)
    parser.add_argument("--dev-size", type=int)
    parser.add_argument("--test-size", type=int)
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto")
    parser.add_argument("--prepare-only", action="store_true")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--eval-only", action="store_true")
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    for key in ["data_dir", "epochs", "train_size", "dev_size", "test_size"]:
        value = getattr(args, key)
        if value is not None:
            config[key] = value
    for key in ["epochs", "batch_size", "stack_frames"]:
        if config[key] <= 0:
            parser.error(f"{key} must be positive")
    for key in ["micro_batch_size", "eval_batch_size"]:
        if config.get(key, 1) <= 0:
            parser.error(f"{key} must be positive")
    if not 0 < config.get("cuda_memory_fraction", 1.0) <= 1:
        parser.error("cuda_memory_fraction must be in (0, 1]")
    if config.get("model_type") in {"lstm_attention_ctc", "transformer_ctc"} and not 0 < config.get("ctc_weight", 0) < 1:  # 联合训练两种损失都须参与。
        parser.error("ctc_weight must be in (0, 1)")  # 拒绝误配。
    for key in ["train_size", "dev_size", "test_size"]:
        if config[key] < 0:
            parser.error(f"{key} must be nonnegative (0 means all utterances)")
    if config.get("feature_storage", "memory") not in {"memory", "disk"}:
        parser.error("feature_storage must be memory or disk")
    output = args.output.expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    # 大数据准备也保存实际配置，便于进程运行中查看。
    if (output / "last.pt").is_file() and not (args.resume or args.eval_only or args.prepare_only):
        parser.error("该目录已有训练结果。请用 --resume 继续，或指定新 --output，保留旧实验。")
    torch.set_num_threads(config["cpu_threads"])
    seed_everything(config["seed"])
    device = torch.device("cuda" if args.device == "auto" and torch.cuda.is_available()
                          else "cpu" if args.device == "auto" else args.device)
    if device.type == "cuda" and not torch.cuda.is_available():
        raise RuntimeError("要求 CUDA，但当前环境看不到 GPU。")
    if device.type == "cuda" and "cuda_memory_fraction" in config:
        torch.cuda.set_per_process_memory_fraction(config["cuda_memory_fraction"])
    write_json(output / "requested_config.json", config)
    data = prepare_dataset(config, output)
    if args.prepare_only:
        print(json.dumps(data["statistics"], ensure_ascii=False, indent=2), flush=True)
        return
    model = build_model(config, len(data["vocab"])).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=config["learning_rate"])
    scheduler = build_scheduler(optimizer, config)  # 有lr_schedule时，learning_rate表示峰值学习率。
    history, best_key, best_epoch, start = [], (float("inf"), float("inf")), 0, 1
    if config.get("warm_start_checkpoint") and not (args.resume or args.eval_only):  # 新实验第一轮前只导入旧模型权重。
        from warm_start_ctc import initialize_from_attention  # 新CTC层仍为随机初始化。
        provenance = initialize_from_attention(model, config, data)  # 核对结构、词表、数据及归一化。
        write_json(output / "initialization.json", provenance)  # 明确源轮次及新Adam状态。
        torch.save(checkpoint_payload(model, optimizer, 0, config, data, [], best_key, 0), output / "initial.pt")  # 保留精确的新阶段起点。
        print("WARM_START: " + json.dumps(provenance, ensure_ascii=False), flush=True)  # 实时日志也能追溯来源。
    if args.eval_only and (output / "history.json").is_file():
        history = json.loads((output / "history.json").read_text(encoding="utf-8"))
    if args.resume:
        previous = torch.load(output / "last.pt", map_location=device, weights_only=False)
        if previous["config"].get("model_type", "rnn") != config.get("model_type", "rnn"):
            raise ValueError("检查点与配置的模型类型不同，请使用对应的独立实验目录。")
        for key in ["hidden_size", "embedding_size", "num_layers", "stack_frames",
                    "d_model", "num_heads", "ffn_size", "encoder_layers", "decoder_layers"]:  # 后五项是Transformer的结构设置。
            if previous["config"].get(key) != config.get(key):  # 某种模型没有的项两边都是None，视为一致。
                raise ValueError(f"恢复训练时结构设置 {key} 不一致。")
        if previous["data_signature"] != data["signature"]:
            raise ValueError("恢复训练时数据划分发生改变。")
        model.load_state_dict(previous["model"])
        optimizer.load_state_dict(previous["optimizer"])
        if scheduler is not None:  # 本实验使用学习率调度。
            if previous.get("scheduler") is None:  # 检查点里没有调度状态，续训的学习率会对不上。
                raise ValueError("配置要求学习率调度，但检查点没有保存调度器状态。")  # 不悄悄从头warmup。
            scheduler.load_state_dict(previous["scheduler"])  # 恢复已走过的步数和当前学习率。
        start = previous["epoch"]+1
        history, best_key, best_epoch = previous["history"], previous["best_key"], previous["best_epoch"]
        random.setstate(previous["python_rng"])
        np.random.set_state(previous["numpy_rng"])
        torch.set_rng_state(previous["torch_rng"].cpu())
        if device.type == "cuda" and previous["cuda_rng"]:
            torch.cuda.set_rng_state_all([state.cpu() for state in previous["cuda_rng"]])
        del previous  # 模型、优化器和随机状态已恢复，释放重复的检查点张量。

    environment = {"torch": torch.__version__, "torchaudio": __import__("torchaudio").__version__,
                   "device": str(device),
                   "gpu": torch.cuda.get_device_name(0) if device.type == "cuda" else None,
                   "parameters": sum(p.numel() for p in model.parameters()),
                   "vocab_size": len(data["vocab"]), "architecture":
                   {"lstm": "LSTM, fixed context, no attention",
                    "lstm_attention": "LSTM, global scaled general attention, no input feeding, no CTC",
                    "lstm_attention_ctc": "LSTM shared encoder, global attention decoder and CTC head, joint training",  # 第四阶段。
                    "transformer_ctc": "Transformer encoder, Transformer attention decoder and CTC head, joint training",  # 第五阶段：结构对照。
                    "rnn": "vanilla RNN, fixed context, no attention"}[config.get("model_type", "rnn")]}
    write_json(output / "config.json", config)
    write_json(output / "environment.json", environment)
    print(json.dumps(environment, ensure_ascii=False), flush=True)
    run_start = time.perf_counter()
    write_json(output / "status.json", {"status": "running", "mode": "evaluation" if args.eval_only else "training"})
    if not args.eval_only:
        training_loader = loader(data["splits"]["train"], config["batch_size"], True, data, config)
        for epoch in range(start, config["epochs"]+1):
            began = time.perf_counter()
            model.train()
            total_loss, total_tokens = 0.0, 0
            attention_total = ctc_total = 0.0  # 联合模型分别统计两种损失。
            ctc_characters = 0  # CTC分母不包含EOS。
            data_wait_seconds = step_seconds = transfer_seconds = gpu_compute_seconds = 0.0
            if device.type == "cuda":
                torch.cuda.reset_peak_memory_stats(device)
            epoch_batches = len(training_loader)
            waiting_since = time.perf_counter()
            for step, batch in enumerate(training_loader, 1):
                data_wait_seconds += time.perf_counter() - waiting_since
                stats = train_step(model, optimizer, batch, device, config, len(data["vocab"]))
                if scheduler is not None:  # 每个有效batch只更新一次参数，所以调度也只走一步（不是每个小批次走一步）。
                    scheduler.step()  # 计算下一次更新要用的学习率。
                total_loss += stats["loss_sum"]
                total_tokens += stats["tokens"]
                if "ctc_loss_sum" in stats:  # 旧模型不进入此分支。
                    attention_total += stats["attention_loss_sum"]  # 保留Attention损失总和。
                    ctc_total += stats["ctc_loss_sum"]  # 保留CTC损失总和。
                    ctc_characters += stats["ctc_characters"]  # 累加真实字数。
                    total_loss = (1-config["ctc_weight"]) * attention_total + config["ctc_weight"] * ctc_total / ctc_characters * total_tokens  # 整轮统一归一化。
                step_seconds += stats["step_seconds"]
                transfer_seconds += stats["transfer_seconds"]
                gpu_compute_seconds += stats["gpu_compute_seconds"]
                if step % config.get("log_every_steps", 1000000) == 0:
                    progress = {"status": "training", "epoch": epoch, "epochs": config["epochs"],
                                "step": step, "steps_per_epoch": epoch_batches,
                                "train_loss_so_far": total_loss/total_tokens,
                                "elapsed_epoch_seconds": time.perf_counter()-began,
                                "micro_batch_size": config.get("micro_batch_size", config["batch_size"]),
                                "data_wait_seconds": data_wait_seconds, "step_seconds": step_seconds,
                                "gpu_compute_seconds": gpu_compute_seconds,
                                "learning_rate": optimizer.param_groups[0]["lr"]}  # 实时查看调度是否按预期在走。
                    write_json(output / "status.json", progress)
                    print(f"epoch={epoch:03d} step={step}/{epoch_batches} "
                          f"train_loss={progress['train_loss_so_far']:.4f} "
                          f"elapsed={progress['elapsed_epoch_seconds']:.1f}s", flush=True)
                waiting_since = time.perf_counter()
            if device.type == "cuda":
                torch.cuda.synchronize()
            record = {"epoch": epoch, "train_loss": total_loss/total_tokens,
                      "learning_rate": optimizer.param_groups[0]["lr"],  # 本轮结束时（下一次更新将用）的学习率。
                      "train_seconds": time.perf_counter()-began,
                      "dev_loss": None, "dev_cer": None, "train_probe_cer": None,
                      "data_wait_seconds": data_wait_seconds, "step_seconds": step_seconds,
                      "transfer_seconds": transfer_seconds, "gpu_compute_seconds": gpu_compute_seconds,
                      "peak_allocated_MiB": torch.cuda.max_memory_allocated(device)/1024**2 if device.type == "cuda" else 0,
                      "peak_reserved_MiB": torch.cuda.max_memory_reserved(device)/1024**2 if device.type == "cuda" else 0}
            print(f"timing epoch={epoch:03d} data_wait={data_wait_seconds:.2f}s "
                  f"steps={step_seconds:.2f}s gpu={gpu_compute_seconds:.2f}s "
                  f"peak_reserved={record['peak_reserved_MiB']:.0f}MiB", flush=True)
            if ctc_characters:  # 将两部分损失独立记录，便于理解CTC支路的学习。
                record.update(train_attention_loss=attention_total/total_tokens, train_ctc_loss=ctc_total/ctc_characters)  # 各自使用正确分母。
                print(f"joint epoch={epoch:03d} attention_loss={record['train_attention_loss']:.4f} ctc_loss={record['train_ctc_loss']:.4f}", flush=True)  # 在实时窗口显示。
            if epoch == 1 or epoch % config["evaluate_every"] == 0 or epoch == config["epochs"]:
                evaluation_began = time.perf_counter()  # 区分训练耗时与完整验证耗时。
                write_json(output / "status.json", {"status": "evaluating", "epoch": epoch, "epochs": config["epochs"], "train_seconds": record["train_seconds"]})  # 不把验证阶段误认为训练卡住。
                dev, _ = evaluate(model, data["splits"]["dev"], data["vocab"], device, config, data)
                probe, _ = evaluate(model, data["splits"]["train"][:config["train_probe_size"]],
                                    data["vocab"], device, config, data)
                record.update(dev_loss=dev["loss"], dev_cer=dev["cer"], train_probe_cer=probe["cer"])
                record["evaluation_seconds"] = time.perf_counter() - evaluation_began  # 包含完整dev和固定训练探针。
                if "ctc_cer" in dev:  # 同时保留CTC指标，但不把它与Attention结果混为一谈。
                    record.update(dev_ctc_cer=dev["ctc_cer"], dev_attention_loss=dev["attention_loss"], dev_ctc_loss=dev["ctc_loss"], train_probe_ctc_cer=probe["ctc_cer"])  # 固定探针不是全训练集。
                    print(f"ctc epoch={epoch:03d} dev_CTC_CER={100*dev['ctc_cer']:.2f}% train_probe_CTC_CER={100*probe['ctc_cer']:.2f}%", flush=True)  # CTC仅作独立诊断。
                candidate_key = (dev["cer"], dev["loss"])
                if candidate_key < tuple(best_key):
                    best_key, best_epoch = candidate_key, epoch
                    torch.save({"model": model.state_dict(), "config": config, "vocab": data["vocab"],
                                "cmvn_mean": data["cmvn_mean"], "cmvn_std": data["cmvn_std"],
                                "epoch": epoch, "data_signature": data["signature"]}, output / "best.pt")
                print(f"epoch={epoch:03d} train_loss={record['train_loss']:.4f} "
                      f"train_probe_CER={100*probe['cer']:.2f}% dev_CER={100*dev['cer']:.2f}% "
                      f"train_seconds={record['train_seconds']:.2f}", flush=True)
            else:
                print(f"epoch={epoch:03d} train_loss={record['train_loss']:.4f} "
                      f"train_seconds={record['train_seconds']:.2f}", flush=True)
            history.append(record)
            write_json(output / "status.json", {"status": "training", "epoch_completed": epoch,
                                               "epochs": config["epochs"], "latest": record})
            torch.save(checkpoint_payload(model, optimizer, epoch, config, data, history,
                                          best_key, best_epoch, scheduler), output / "last.pt")  # 调度器状态一起保存。
            write_json(output / "history.json", history)
            with (output / "history.csv").open("w", encoding="utf-8", newline="") as stream:
                fields = list(dict.fromkeys(key for row in history for key in row))
                writer = csv.DictWriter(stream, fieldnames=fields)
                writer.writeheader()
                writer.writerows(history)

    if not (output / "best.pt").is_file():
        raise RuntimeError("没有最佳模型可评测。请先训练至少一轮。")
    best = torch.load(output / "best.pt", map_location=device, weights_only=False)
    model.load_state_dict(best["model"])
    results, examples = {}, {}
    for split in ["train", "dev", "test"]:
        print(f"final evaluation: {split} ({len(data['splits'][split])} utterances)", flush=True)
        results[split], examples[split] = evaluate(model, data["splits"][split], data["vocab"], device, config, data)
        write_json(output / f"predictions_{split}.json", examples[split])
    summary = {"status": "completed", "selection": "lowest dev CER, then lowest dev loss",
               "best_epoch": best["epoch"], "epochs_recorded": len(history),
               "training_and_evaluation_seconds": time.perf_counter()-run_start,
               "environment": environment, "data_statistics": data["statistics"], "metrics": results,
               "evaluation": "greedy autoregressive decoding; no reference text is fed for predictions",
               "scope": (f"full AISHELL train/dev/test; {config.get('model_type', 'rnn')} teaching experiment" if config.get("require_complete")
                         else "filtered AISHELL subset; teaching experiment")}
    write_json(output / "summary.json", summary)
    write_report(output, summary, history, examples)
    write_json(output / "status.json", {"status": "completed", "best_epoch": best["epoch"]})
    print(json.dumps(summary, ensure_ascii=False, indent=2), flush=True)
    print(f"REPORT: {output / 'experiment_report.html'}", flush=True)


if __name__ == "__main__":
    main()
```


## training_steps.py 损失与参数更新

```python
"""把一个有效batch拆成小块求梯度；所有小块完成后只更新一次参数。"""  # 不改变每次参数更新所用的总语音数。
import time  # 记录实际训练时间。
import torch  # 张量、梯度和CUDA计时。
from torch.nn import functional as F  # 交叉熵损失。
from data import PAD  # 补齐字符不参与损失。


def backward_effective_batch(model, batch, device, config, vocab_size):  # 此函数累积梯度，不清空梯度、不执行优化器更新。
    size = batch["features"].size(0)  # 当前有效batch的语音数；末批可能不足512。
    micro = min(config.get("micro_batch_size", size), size)  # 一次送入显卡的语音数，例如256。
    count = int(batch["targets"].ne(PAD).sum().item())  # 先在CPU上统计整个有效batch的真实目标字符数。
    if micro <= 0 or count == 0:  # 防止错误配置或空目标导致除零。
        raise ValueError("micro_batch_size和有效目标字符数必须为正。")  # 明确报告问题。
    non_blocking = config.get("pin_memory", False)  # 沿用原来的固定内存传输设置。
    profile = config.get("profile_steps", False) and device.type == "cuda"  # CUDA事件只在启用计时时创建。
    events = []  # 保存每个小块的传输、计算起止事件。
    parts = []  # 保存已分离计算图的损失标量，不保存大输出张量。
    for begin in range(0, size, micro):  # 512条会分成256+256；最后不足一块时也照常处理。
        end = min(begin + micro, size)  # 保证末块不会越界。
        if profile:  # 用CUDA事件测量异步GPU工作。
            transfer_start, transfer_end, backward_end = [torch.cuda.Event(enable_timing=True) for _ in range(3)]  # 三个边界。
            transfer_start.record()  # CPU到GPU复制开始。
        features = batch["features"][begin:end].to(device, non_blocking=non_blocking)  # 只把本小块声音放上显卡。
        inputs = batch["decoder_inputs"][begin:end].to(device, non_blocking=non_blocking)  # 本小块的正确文字前缀。
        targets = batch["targets"][begin:end].to(device, non_blocking=non_blocking)  # 本小块需要预测的文字。
        if profile:  # 数据复制与网络计算分开计时。
            transfer_end.record()  # 复制结束，前向计算将开始。
        logits = model(features, batch["lengths"][begin:end], inputs)  # 用相同网络计算当前小块。
        loss_sum = F.cross_entropy(logits.reshape(-1, vocab_size), targets.reshape(-1), ignore_index=PAD, reduction="sum")  # 累加有效字符损失。
        loss = loss_sum / count  # 除以整个512条的字符总数；不能分别取均值后简单除2。
        if not torch.isfinite(loss):  # 与原训练一样检查异常数值。
            raise RuntimeError("训练损失出现NaN/Inf，停止以免保存无效权重。")  # 不继续更新。
        loss.backward()  # 将本小块梯度加到已有梯度上，下一块继续累积。
        if profile:  # 反向结束；尚未执行参数更新。
            backward_end.record()  # GPU计算阶段的结束位置。
            events.append((transfer_start, transfer_end, backward_end))  # 稍后同步后读取耗时。
        parts.append(loss_sum.detach())  # 只保留一个标量供报告loss使用。
        del logits, loss, loss_sum, targets, inputs, features  # 及时释放本小块的大张量，再计算下一块。
    return torch.stack(parts).sum(), count, events  # 所有小块贡献合成整个有效batch的结果。


def train_step(model, optimizer, batch, device, config, vocab_size):  # 一个调用仍对应一次参数更新。
    if config.get("model_type") in {"lstm_attention_ctc", "transformer_ctc"}:  # 联合模型同时计算CTC和Attention两种损失。
        from training_steps_ctc import train_joint_step  # 原来的三种模型继续使用下方原公式。
        return train_joint_step(model, optimizer, batch, device, config, vocab_size)  # 有效batch与更新频率保持一致。
    began = time.perf_counter()  # 记录包含CPU操作的实际步骤耗时。
    optimizer.zero_grad(set_to_none=True)  # 仅在整个有效batch开始前清空一次梯度。
    loss_sum, count, events = backward_effective_batch(model, batch, device, config, vocab_size)  # 累积全部小块。
    torch.nn.utils.clip_grad_norm_(model.parameters(), config["grad_clip"])  # 累积完成后统一裁剪一次。
    optimizer.step()  # 512条全部处理完成，才统一更新一次Adam参数。
    if events:  # 记录裁剪和参数更新后的GPU事件。
        update_end = torch.cuda.Event(enable_timing=True)  # 更新阶段的结束标记。
        update_end.record()  # 标记放在与更新相同的默认CUDA流中。
    value = loss_sum.item()  # 与原实现一样读取loss；这也等待本步默认流上的更新完成。
    transfer = sum(start.elapsed_time(copied) for start, copied, _ in events) / 1000 if events else 0.0  # 各小块复制秒数。
    compute = sum(copied.elapsed_time(done) for _, copied, done in events) / 1000 if events else 0.0  # 前向与反向秒数。
    if events:  # 加上统一梯度裁剪和Adam更新的时间。
        compute += events[-1][-1].elapsed_time(update_end) / 1000  # 事件耗时已通过上面的item同步。
    return {"loss_sum": value, "tokens": count, "step_seconds": time.perf_counter()-began,
            "transfer_seconds": transfer, "gpu_compute_seconds": compute}  # 这些统计不参与梯度计算。
```


## metrics.py 字错误率

```python
"""不依赖第三方评测包的字错误率。参考文字保留原字符，未知字符也算错误。"""


def edit_distance(reference: str, hypothesis: str) -> int:
    previous = list(range(len(hypothesis)+1))
    for i, a in enumerate(reference, 1):
        current = [i]
        for j, b in enumerate(hypothesis, 1):
            current.append(min(current[-1]+1, previous[j]+1, previous[j-1]+(a != b)))
        previous = current
    return previous[-1]


def summarize(rows: list[dict]) -> dict:
    errors = sum(row["edits"] for row in rows)
    chars = sum(len(row["reference"]) for row in rows)
    exact = sum(row["reference"] == row["prediction"] for row in rows)
    return {"utterances": len(rows), "errors": errors, "reference_characters": chars,
            "cer": errors/max(1, chars), "exact_utterances": exact,
            "exact_match_rate": exact/max(1, len(rows))}
```


## report.py 结果报告

```python
"""仅根据真实运行记录生成本地 HTML 报告，不预填任何训练结果。"""
import html
import json
from pathlib import Path


def chart(history):
    width, height = 900, 265
    left, top, right, bottom = 56, 20, 870, 218
    maximum = max([r["train_loss"] for r in history]+[0.1]) * 1.1
    max_epoch = max([r["epoch"] for r in history]+[1])
    points = " ".join(f"{left+(right-left)*r['epoch']/max_epoch:.1f},"
                      f"{bottom-(bottom-top)*r['train_loss']/maximum:.1f}" for r in history)
    lines = []
    for fraction in [0, .25, .5, .75, 1]:
        y = bottom-(bottom-top)*fraction
        lines.append(f'<line x1="{left}" y1="{y}" x2="{right}" y2="{y}" stroke="#dce4ed"/>'
                     f'<text x="46" y="{y+4}" text-anchor="end">{maximum*fraction:.1f}</text>')
    return (f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="训练损失随轮数变化">'
            + ''.join(lines) + f'<polyline fill="none" stroke="#167d8d" stroke-width="3" points="{points}"/>'
            + f'<text x="{left}" y="250">0</text><text x="{right-50}" y="250">{max_epoch} epoch</text></svg>')


def write_report(output: Path, summary: dict, history: list, predictions: dict):
    e = html.escape
    rows = ''.join(f'<tr><td>{split}</td><td>{summary["metrics"][split]["utterances"]}</td>'
                   f'<td>{summary["metrics"][split]["cer"]*100:.2f}%</td>'
                   f'<td>{summary["metrics"][split]["exact_utterances"]}</td>'
                   f'<td>{summary["data_statistics"][split]["unknown_rate"]*100:.2f}%</td></tr>'
                   for split in ['train', 'dev', 'test'])
    examples = []
    for split in ['train', 'dev', 'test']:
        samples = ''.join(f'<tr><td>{e(r["id"])}</td><td>{e(r["reference"])}</td>'
                          f'<td>{e(r["prediction"]) or "（空输出）"}</td><td>{r["edits"]}</td></tr>'
                          for r in predictions[split][:12])
        examples.append(f'<h3>{split} 的前 12 条样例</h3><table><thead><tr><th>ID</th><th>正确文字</th>'
                        f'<th>模型独立识别</th><th>编辑错误数</th></tr></thead><tbody>{samples}</tbody></table>')
    config = json.loads((output/'config.json').read_text(encoding='utf-8'))
    kind = config.get("model_type", "rnn")
    joint = kind in {"lstm_attention_ctc", "transformer_ctc"}  # 两种联合模型都有CTC支路。
    attention = kind in {"lstm_attention", "lstm_attention_ctc", "transformer_ctc"}
    network = {"rnn": "普通 RNN", "lstm": "LSTM", "lstm_attention": "LSTM + 注意力", "lstm_attention_ctc": "LSTM + Attention + CTC",
               "transformer_ctc": "Transformer + Attention + CTC"}[kind]
    model_file = {"rnn": "model.py", "lstm": "model_lstm.py", "lstm_attention": "model_lstm_attention.py", "lstm_attention_ctc": "model_lstm_attention_ctc.py",
                  "transformer_ctc": "model_transformer_ctc.py"}[kind]
    context_name = "z" if kind != "rnn" else "c"
    state_note = ("LSTM 的循环状态是一对(h,c)，其中细胞状态c与本报告的固定语音向量z是不同概念。"
                  if kind != "rnn" else "")
    if attention:
        introduction = "编码器和解码器都使用 LSTM。编码器保留整段声音的输出，解码器在每个文字步通过全局注意力重新读取声音。"
        pipeline = "声音 → 80维 Fbank → 相邻4帧拼接 → LSTM编码器的整段输出 → 每个文字步的注意力加权读取 → LSTM解码器逐字输出"
        mechanism = "每个文字步用解码状态给有效声音位置打分，softmax 后加权求和。补齐位置权重为0，动态上下文与解码状态融合后预测字符。编码器最终(h,c)仍用于初始化解码器；本模型不使用上下文输入反馈、Transformer 或 CTC。"
        reading = f"先读 {model_file} 的 encode：这里保留了所有声音位置的输出。再读 attend：打分、屏蔽补齐位置、归一化、加权求和。最后比较 forward 和 greedy_decode：实际识别时不给正确文字。"
    else:
        introduction = f"编码器和解码器都使用{network}，通过固定长度的状态连接，没有注意力、Transformer 或 CTC。"
        pipeline = f"声音 → 80维 Fbank → 相邻4帧拼接 → {network}编码器 → 固定语音向量 {context_name} → {network}解码器 → 逐字输出"
        mechanism = f"解码器每一步读取的固定语音向量都相同。它不会回头选择某个声音位置，因此这里没有注意力。{state_note}"
        reading = f"先读 {model_file} 的 encode，查看它怎样取得编码器最后的状态。再读 decode，查看固定语音向量、前一个字和解码器状态怎样合作。最后看 train.py 中损失计算与 greedy_decode 的区别。"
    joint_details = ""
    if joint:
        body = "Transformer" if kind == "transformer_ctc" else "LSTM"  # 编码器和解码器的结构名称。
        introduction = f"共享{body}编码器，两条支路联合训练：Attention根据文字前缀读取声音，CTC直接在声音位置预测字符或blank。"
        pipeline = f"声音 → Fbank → 共享{body}编码器 ┬→ Attention + {body}解码器 → 逐字输出\n                                └→ CTC线性层 → 逐帧预测 → 合并重复并删除blank"
        mechanism = f"联合损失=(1−{config['ctc_weight']})×Attention交叉熵+{config['ctc_weight']}×CTC损失。两部分分别按有效目标数归一化；全部原模型参数和新增CTC层都参与训练。主CER使用Attention贪心解码；CTC贪心CER另列，没有联合束搜索或重打分。"
        reading = f"先看{model_file}的joint_forward，再看ctc_objective.py和training_steps_ctc.py。CTC不需要预先给每一帧标字，会对可行的单调对齐路径求和；它不是一种注意力。"
        ctc_rows = ''.join(f'<tr><td>{split}</td><td>{summary["metrics"][split]["ctc_cer"]*100:.2f}%</td></tr>' for split in ['train', 'dev', 'test'])
        joint_details = '<h2>CTC支路独立识别</h2><table><tr><th>划分</th><th>CTC贪心CER</th></tr>' + ctc_rows + '</table>' + ('<p>本实验从旧Attention最佳模型初始化，使用新的Adam；不属于从头训练的严格架构对照。新阶段轮次单独计数。</p>'
                       if config.get("warm_start_checkpoint") else
                       '<p>本实验从随机初始化开始训练，使用SpecAugment、dropout、label smoothing和warmup+Noam学习率调度，用于LSTM与Transformer的结构对照。</p>')
    data_scope = "完整 AISHELL 原始划分" if config.get("require_complete") else "AISHELL 小样本"
    scale_note = (f"这是{network}的教学实验；是否能识别新语音，需要依据实际 CER 判断。"
                  if config.get("require_complete") else "样本规模很小，不能用这里的结果代表完整语音识别能力。")
    env = summary['environment']
    progress_rows = ''.join(
        f'<tr><td>{r["epoch"]}</td><td>{r["train_loss"]:.4f}</td>'
        f'<td>{r["train_probe_cer"]*100:.2f}%</td><td>{r["dev_cer"]*100:.2f}%</td></tr>'
        for r in history if r.get('dev_cer') is not None)
    document = f'''<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>{network}语音编解码实验</title>
<style>body{{font:18px/1.75 "Microsoft YaHei",sans-serif;color:#223448;background:#f5f7fa;margin:0}}
main{{max-width:1050px;margin:32px auto;background:white;padding:36px 44px}}h1,h2,h3{{color:#192d43;line-height:1.4}}
h2{{margin-top:32px}}table{{border-collapse:collapse;width:100%;margin:18px 0;font-size:16px}}
th,td{{border:1px solid #d7e0e7;padding:10px;text-align:left;overflow-wrap:anywhere}}th{{background:#e9f4f4}}
pre{{white-space:pre-wrap;background:#f3f6f9;padding:18px;font-size:16px}}svg{{width:100%;font-size:13px}}
.small{{font-size:15px;color:#5a6b7c}}@media(max-width:700px){{main{{margin:0;padding:20px}}table{{font-size:14px}}}}</style>
<main><h1>{network}语音编解码实验</h1>
<p>这是一个使用{data_scope}的教学实验。{introduction}</p>
<pre>{pipeline}</pre>
<p>{mechanism}</p>
<h2>实际运行</h2><p>设备：{e(str(env['gpu'] or env['device']))}；参数量：{env['parameters']:,}；
词表大小：{env['vocab_size']}；最佳模型：第 {summary['best_epoch']} 轮；记录轮数：{summary['epochs_recorded']}。</p>
<p>模型按验证集 dev 的字错误率选优，测试集 test 仅用于最终评测。以下识别文字由模型逐字生成，没有把参考文字输入解码器。</p>
<table><thead><tr><th>数据划分</th><th>样本数</th><th>CER 越低越好</th><th>整句正确数</th><th>参考字中词表外比例</th></tr></thead>
<tbody>{rows}</tbody></table>
<p><b>先比较 train 和 dev/test。</b>训练集识别好而新语音差，说明可能主要记住了训练样本。若两边都差，需要检查训练是否充分，以及输入表示、优化设置和网络结构。{scale_note}</p>
<p>词表和特征归一化只使用训练样本。验证或测试中未出现过的字记作词表外；预测未知字显示为“□”，评测仍对照原始正确文字，不会把这些错误删掉。CER 可以超过 100%，例如模型插入了大量多余文字。</p>
{joint_details}<h2>训练损失</h2>{chart(history)}
<p>Attention损失使用teacher forcing：给前一个正确字，预测下一个字；联合模型还包含不使用文字前缀的CTC损失。损失下降本身不等于能独立识别，需同时看自由生成CER。</p>
<table><thead><tr><th>轮次</th><th>训练 loss</th><th>固定训练样本 CER</th><th>验证集 CER</th></tr></thead><tbody>{progress_rows}</tbody></table>
<p>上表的训练 CER 只针对固定的少量训练样本；页面顶部的 train CER 则使用全部训练样本。最终识别样例来自按验证集选出的最佳模型，可能与最后一轮不同。</p>
<h2>真正识别出的文字</h2>{''.join(examples)}
<h2>你接下来可以看哪些代码</h2>
<p>{reading}</p>
<pre>{e(json.dumps(config,ensure_ascii=False,indent=2))}</pre>
<p class="small">数据划分、训练记录、模型权重和所有识别样例都与本报告放在同一输出目录。当前报告由运行结果自动生成。</p></main></html>'''
    (output/'experiment_report.html').write_text(document, encoding='utf-8')
```


## predict.py 单条识别

```python
"""加载自己的 best.pt，识别一条单声道 16 kHz PCM WAV。"""
import argparse
from pathlib import Path

import torch

from data import fbank_for_file, ids_to_text
from models import build_model


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkpoint", type=Path)
    parser.add_argument("wav", type=Path)
    parser.add_argument("--decoder", choices=["attention", "ctc"], default="attention")
    args = parser.parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    saved = torch.load(args.checkpoint, map_location="cpu", weights_only=False)
    config = saved["config"]
    model = build_model(config, len(saved["vocab"])).to(device).eval()
    model.load_state_dict(saved["model"])
    features = fbank_for_file(str(args.wav), config)
    features = (features-saved["cmvn_mean"]) / saved["cmvn_std"]
    if args.decoder == "ctc":
        if not hasattr(model, "ctc_greedy_decode"):
            parser.error("该检查点没有CTC支路。")
        output = model.ctc_greedy_decode(features.unsqueeze(0).to(device), torch.tensor([features.size(0)]))
    else:
        output = model.greedy_decode(features.unsqueeze(0).to(device), torch.tensor([features.size(0)]),
                                     config["max_decode_steps"])
    print(ids_to_text(output[0], saved["vocab"]))


if __name__ == "__main__":
    main()
```


## test_core.py 核心检查

```python
"""检查真实容易出错的边界：补齐帧、文字错位、因果关系和梯度连接。"""
import json
from pathlib import Path
import unittest

import torch
from torch import nn
from torch.nn import functional as F

from data import BOS, EOS, PAD, collate, ids_to_text
from metrics import edit_distance, summarize
from model import RNNEncoderDecoder


class CoreChecks(unittest.TestCase):
    def setUp(self):
        torch.manual_seed(7)
        self.config = json.loads(Path(__file__).with_name("config.json").read_text(encoding="utf-8"))
        self.config.update(hidden_size=12, embedding_size=8, num_layers=1)
        self.model = RNNEncoderDecoder(self.config, 9).eval()

    def test_padding_cannot_change_encoder_summary(self):
        features = torch.randn(2, 13, 80)
        lengths = torch.tensor([13, 5])
        original = self.model.encode(features, lengths)[0]
        features[1, 5:] = 999
        changed = self.model.encode(features, lengths)[0]
        torch.testing.assert_close(original, changed)
        alone = self.model.encode(features[1:2, :5], torch.tensor([5]))[0]
        torch.testing.assert_close(original[1:2], alone)

    def test_future_text_cannot_change_previous_logits(self):
        features, lengths = torch.randn(1, 11, 80), torch.tensor([11])
        a = torch.tensor([[BOS, 4, 5, 6]])
        b = torch.tensor([[BOS, 4, 8, 7]])
        out_a = self.model(features, lengths, a)
        out_b = self.model(features, lengths, b)
        torch.testing.assert_close(out_a[:, :2], out_b[:, :2])

    def test_teacher_forcing_shift_and_padding(self):
        samples = [{"features": torch.ones(5, 80), "tokens": [4, 5]},
                   {"features": torch.ones(3, 80), "tokens": [6]}]
        batch = collate(samples)
        self.assertEqual(batch["decoder_inputs"].tolist(), [[BOS, 4, 5], [BOS, 6, PAD]])
        self.assertEqual(batch["targets"].tolist(), [[4, 5, EOS], [6, EOS, PAD]])

    def test_only_plain_rnn_cells(self):
        modules = list(self.model.modules())
        self.assertEqual(sum(isinstance(m, nn.RNN) for m in modules), 2)
        self.assertFalse(any(isinstance(m, (nn.LSTM, nn.GRU, nn.MultiheadAttention)) for m in modules))

    def test_loss_reaches_encoder_and_decoder(self):
        batch = collate([{"features": torch.randn(9, 80), "tokens": [4, 5]}])
        logits = self.model(batch["features"], batch["lengths"], batch["decoder_inputs"])
        loss = F.cross_entropy(logits.flatten(0, 1), batch["targets"].flatten(), ignore_index=PAD)
        loss.backward()
        for module in [self.model.encoder, self.model.decoder]:
            self.assertTrue(all(p.grad is not None and torch.isfinite(p.grad).all() for p in module.parameters()))
            self.assertGreater(sum(p.grad.abs().sum().item() for p in module.parameters()), 0)

    def test_cer_and_special_tokens(self):
        self.assertEqual(edit_distance("你好", "您好"), 1)
        self.assertEqual(edit_distance("", "你好"), 2)
        self.assertEqual(edit_distance("哈哈", "哈"), 1)
        self.assertEqual(summarize([{"reference": "你", "prediction": "你好呀", "edits": 2}])["cer"], 2)
        self.assertEqual(ids_to_text([BOS, 4, 3, EOS, 5], ["p", "b", "e", "u", "你", "好"]), "你□")


if __name__ == "__main__":
    unittest.main(verbosity=2)
```


## config.json 小样本配置

```json
{
  "seed": 20261017,
  "data_dir": "/home/qd/wenet/examples/aishell/s0/data",
  "train_size": 128,
  "dev_size": 32,
  "test_size": 32,
  "min_seconds": 1.0,
  "max_seconds": 4.5,
  "min_chars": 4,
  "max_chars": 20,
  "sample_rate": 16000,
  "num_mel_bins": 80,
  "frame_length": 25,
  "frame_shift": 10,
  "stack_frames": 4,
  "hidden_size": 192,
  "embedding_size": 128,
  "num_layers": 1,
  "batch_size": 16,
  "epochs": 60,
  "learning_rate": 0.001,
  "grad_clip": 5.0,
  "evaluate_every": 5,
  "max_decode_steps": 48,
  "train_probe_size": 16,
  "cpu_threads": 4
}
```


## config_full.json 全量配置

```json
{
  "seed": 20261017,
  "data_dir": "/home/qd/wenet/examples/aishell/s0/data",
  "train_size": 0,
  "dev_size": 0,
  "test_size": 0,
  "require_complete": true,
  "feature_storage": "disk",
  "min_seconds": 0.025,
  "max_seconds": 120.0,
  "min_chars": 1,
  "max_chars": 200,
  "sample_rate": 16000,
  "num_mel_bins": 80,
  "frame_length": 25,
  "frame_shift": 10,
  "stack_frames": 4,
  "hidden_size": 192,
  "embedding_size": 128,
  "num_layers": 1,
  "batch_size": 512,
  "epochs": 60,
  "learning_rate": 0.001,
  "grad_clip": 5.0,
  "evaluate_every": 5,
  "max_decode_steps": 64,
  "train_probe_size": 128,
  "cpu_threads": 4,
  "num_workers": 8,
  "log_every_steps": 25,
  "pin_memory": true,
  "prefetch_factor": 1
}
```


## run_rnn.ps1 原 WSL 启动器

```powershell
param(
    [int]$Epochs = 60,
    [string]$RunName = 'rnn_001',
    [string]$Distribution = 'Ubuntu-24.04',
    [ValidateSet('auto', 'cpu', 'cuda')][string]$Device = 'cuda',
    [switch]$Resume,
    [switch]$PrepareOnly
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Invoke-WslChecked {
    param([string[]]$WslArguments, [string]$FailureMessage, [string]$LogPath)
    $previousPreference = $ErrorActionPreference
    try {
        # Windows PowerShell 5.1 can turn native stderr into NativeCommandError.
        # Preserve the text, and determine success from the actual process exit code.
        $ErrorActionPreference = 'Continue'
        if ($LogPath) {
            & wsl.exe @WslArguments 2>&1 | ForEach-Object { $_.ToString() } |
                Tee-Object -FilePath $LogPath -Append -ErrorAction Stop
        } else {
            & wsl.exe @WslArguments 2>&1 | ForEach-Object { $_.ToString() }
        }
        $processExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    if ($processExitCode -ne 0) { throw ($FailureMessage + " (exit code: $processExitCode)") }
}

if ($RunName -notmatch '^[a-zA-Z0-9_-]+$') { throw 'RunName 只能包含字母、数字、下划线和横线。' }
if ($Epochs -lt 1) { throw 'Epochs 必须为正数。' }
$projectPath = (Resolve-Path -LiteralPath $PSScriptRoot).Path
$linuxProject = '/mnt/' + $projectPath.Substring(0, 1).ToLowerInvariant() + $projectPath.Substring(2).Replace('\', '/')
$linuxOutput = '/home/qd/asr_learning/' + $RunName
$localResults = Join-Path $projectPath ('runs/' + $RunName)
New-Item -ItemType Directory -Path $localResults -Force | Out-Null
$pythonPath = '/home/qd/.venvs/wenet/bin/python'
Invoke-WslChecked -WslArguments @('-d', $Distribution, '--', $pythonPath, ($linuxProject + '/test_core.py')) `
    -FailureMessage '模型核心检查失败，尚未启动训练。'
$arguments = @('-d', $Distribution, '--', $pythonPath, '-u', ($linuxProject + '/train.py'),
               '--output', $linuxOutput, '--epochs', [string]$Epochs, '--device', $Device)
if ($Resume) { $arguments += '--resume' }
if ($PrepareOnly) { $arguments += '--prepare-only' }
Invoke-WslChecked -WslArguments $arguments -LogPath (Join-Path $localResults 'console.log') `
    -FailureMessage '实验运行失败，请查看控制台和 console.log。未把失败当作完成。'
if (-not $PrepareOnly) {
    # 音频、特征缓存和训练检查点保留在 E 盘承载的 WSL 文件系统。
    # Windows 只镜像小型报告和识别结果，不复制整份数据集。
    $reportFiles = @('experiment_report.html', 'summary.json', 'history.csv', 'history.json',
                    'config.json', 'environment.json', 'data_statistics.json', 'vocab.json',
                    'predictions_train.json', 'predictions_dev.json', 'predictions_test.json', 'status.json')
    $linuxLocal = $linuxProject + '/runs/' + $RunName
    foreach ($name in $reportFiles) {
        Invoke-WslChecked -WslArguments @('-d', $Distribution, '--', 'cp', ($linuxOutput + '/' + $name), ($linuxLocal + '/' + $name)) `
            -FailureMessage ('复制报告失败：' + $name)
    }
    Write-Host ('报告：' + (Join-Path $localResults 'experiment_report.html'))
}
```


## model_lstm.py 模型选择文件需要的后续模型依赖

```python
# 这是第二阶段：保持“声音编码 → 固定向量 → 逐字解码”，把两台普通 RNN 换成 LSTM。
# B 是一批语音数量，T 是声音帧数，H=192 是状态长度，K=1 是网络层数，U 是文字步数。
# LSTM 的状态是一对 (h, c)：h 是隐藏状态，c 是细胞状态；它们都会随时间更新。
# 本文件把固定语音向量叫 z，避免它与 LSTM 自己的细胞状态 c 混淆。
"""带中文逐行注释的 LSTM 编码器—解码器，固定向量，无注意力。"""  # 文件说明。
from __future__ import annotations  # 类型提示不影响网络计算。

import torch  # 提供张量、GPU 运算与自动求导。
from torch import nn  # 提供 LSTM、线性层和嵌入层。
from torch.nn import functional as F  # 用 F.pad 补齐声音帧。
from torch.nn.utils.rnn import pack_padded_sequence  # 让 LSTM 跳过补齐的声音位置。
from data import BOS, EOS, PAD  # 起始、结束、补齐三个特殊符号的编号。


class LSTMEncoderDecoder(nn.Module):  # 整个模型包含独立的 LSTM 编码器与解码器。
    def __init__(self, config: dict, vocab_size: int):  # 根据配置搭建部件；这里还没有开始训练。
        super().__init__()  # 初始化父类，让 PyTorch 管理模型参数。
        self.stack = config["stack_frames"]  # 相邻4帧拼成一组，减少循环步数。
        self.hidden_size = config["hidden_size"]  # h 和 c 每个状态向量的长度，当前为192。
        self.num_layers = config["num_layers"]  # 编码器和解码器各有1层 LSTM。
        self.input_projection = nn.Linear(config["num_mel_bins"] * self.stack, self.hidden_size)  # 每组320维声音转成192维。
        self.encoder = nn.LSTM(  # 第一台 LSTM：沿时间读取声音特征。
            self.hidden_size, self.hidden_size, num_layers=self.num_layers, batch_first=True,  # 输入192维，h和c也各192维。
        )  # 门控和细胞状态的更新公式已经由 nn.LSTM 实现。
        self.embedding = nn.Embedding(vocab_size, config["embedding_size"], padding_idx=PAD)  # 文字编号查成128维向量。
        self.decoder = nn.LSTM(  # 第二台 LSTM：根据声音信息和前一个字生成文字。
            config["embedding_size"] + self.hidden_size, self.hidden_size,  # 输入为128维文字向量加192维固定语音向量。
            num_layers=self.num_layers, batch_first=True,  # 每层都维护自己的 h 和 c；批次维排在最前面。
        )  # 两台 LSTM 参数不同，解码器不是再次调用编码器。
        self.output_projection = nn.Linear(self.hidden_size, vocab_size)  # 把192维解码状态变成每个候选符号的分数。

    def encode(self, features: torch.Tensor, lengths: torch.Tensor):  # 声音特征[B,T,80]与每条语音的真实帧数[B]。
        batch, time, bins = features.shape  # 取得批次数、补齐后的帧数、每帧维度。
        pad = (-time) % self.stack  # 计算还需要补多少帧，才能按4帧分组。
        stacked = F.pad(features, (0, 0, 0, pad)).reshape(batch, -1, bins * self.stack)  # 相邻4帧合为320维。
        positions = torch.arange(stacked.size(1) * self.stack, device=features.device)  # 建立声音帧的位置编号。
        frame_mask = positions.unsqueeze(0) < lengths.to(features.device).unsqueeze(1)  # 标出各条录音的真实帧。
        stacked = stacked.reshape(batch, -1, self.stack, bins)  # 拆出组内帧维度，以便处理最后不足4帧的组。
        stacked = stacked * frame_mask.reshape(batch, -1, self.stack, 1)  # 将补齐帧清零，防止它们污染声音表示。
        stacked = stacked.reshape(batch, -1, self.stack * bins)  # 重新变成每组320维的序列。
        projected = torch.tanh(self.input_projection(stacked))  # 线性投影后加非线性，得到[B,组数,192]。
        down_lengths = (lengths + self.stack - 1) // self.stack  # 计算每条录音真实包含多少组，向上取整。
        packed = pack_padded_sequence(projected, down_lengths.cpu(), batch_first=True, enforce_sorted=False)  # 跳过末尾补齐组。
        _, (h_n, c_n) = self.encoder(packed)  # 与普通RNN不同：LSTM返回最终h和最终c，各自形状[K,B,H]。
        context = h_n[-1]  # 取最后一层的最终h，作为固定语音向量z，形状[B,H]。
        state = (h_n, c_n)  # 同时保留两种状态，准备一起初始化解码器。
        return context, state  # z用于每个文字步；这对状态则由解码器不断更新。

    def decode(self, previous_tokens, context, state):  # 传入文字编号[B,U]、固定z[B,H]和状态(h,c)。
        embedded = self.embedding(previous_tokens)  # 将每个文字编号转成向量，得到[B,U,128]。
        repeated_context = context.unsqueeze(1).expand(-1, embedded.size(1), -1)  # 每个文字位置都读取同一份z。
        inputs = torch.cat([embedded, repeated_context], dim=-1)  # 文字128维与声音192维拼成320维。
        output, state = self.decoder(inputs, state)  # LSTM更新h和c，output是各文字步的隐藏状态。
        return self.output_projection(output), state  # 返回候选符号分数，以及更新后的(h,c)。

    def forward(self, features, lengths, decoder_inputs):  # 训练时由model(...)调用，接收右移后的正确文字。
        context, state = self.encode(features, lengths)  # 编码整段语音，获得固定z和编码器最终(h,c)。
        logits, _ = self.decode(decoder_inputs, context, state)  # 从正确文字前缀计算预测分数；梯度仍能传回编码器。
        return logits  # 返回[B,U,词表大小]，交给训练程序计算交叉熵。

    @torch.no_grad()  # 实际识别不记录梯度，也不更新参数。
    def greedy_decode(self, features, lengths, max_steps=64):  # 从起始符开始，每一步选择最高分符号。
        context, state = self.encode(features, lengths)  # 只读取声音，不把正确文字交给模型。
        previous = torch.full((features.size(0), 1), BOS, device=features.device, dtype=torch.long)  # 每条语音从起始符开始。
        finished = torch.zeros(features.size(0), device=features.device, dtype=torch.bool)  # 记录哪些语音已经输出结束符。
        outputs = []  # 保存每一步生成的文字编号。
        for _ in range(max_steps):  # 设置生成长度上限，避免模型迟迟不结束。
            logits, state = self.decode(previous, context, state)  # z保持固定，解码器的h和c持续更新。
            scores = logits[:, -1].clone()  # 每条语音取这一步的候选符号分数。
            scores[:, PAD] = -torch.inf  # 补齐符不能作为识别结果。
            scores[:, BOS] = -torch.inf  # 起始符不能在句子中重复生成。
            token = scores.argmax(-1)  # 选择每条语音当前得分最高的符号。
            token = torch.where(finished, torch.full_like(token, EOS), token)  # 已结束的语音保持结束。
            outputs.append(token)  # 保存当前生成结果。
            finished |= token.eq(EOS)  # 新生成结束符的语音也标记为结束。
            previous = token.unsqueeze(1)  # 把本步选出的字作为下一步输入。
            if finished.all():  # 这一批全部结束时可以提前退出。
                break  # 结束生成循环。
        return torch.stack(outputs, dim=1).cpu().tolist()  # 编号序列交给data.py转换为文字。
```


## model_lstm_attention.py 模型选择文件需要的后续模型依赖

```python
"""第三阶段：LSTM 编解码器加全局注意力；每个文字步重新读取整段声音表示。"""  # 本模型用于与固定向量 LSTM 对照。
from __future__ import annotations  # 允许在类型提示中直接写类型名称。

import math  # 用平方根缩放注意力分数。
import torch  # 提供张量、矩阵乘法和自动求导。
from torch import nn  # 提供嵌入层、LSTM 和线性层。
from torch.nn import functional as F  # 用 F.pad 补齐声音帧。
from torch.nn.utils.rnn import pack_padded_sequence, pad_packed_sequence  # 编码时跳过补齐，再还原整段输出。
from data import BOS, EOS, PAD  # 特殊符号的编号与其他实验相同。


class AttentionLSTMEncoderDecoder(nn.Module):  # 编码器和解码器仍然都是 LSTM。
    def __init__(self, config: dict, vocab_size: int):  # 搭建网络；此处不会读取旧模型权重。
        super().__init__()  # 让 PyTorch 管理各层参数。
        self.stack = config["stack_frames"]  # 相邻4帧合并，减少声音时间步数。
        self.hidden_size = config["hidden_size"]  # 每个声音位置和解码状态均为192维。
        self.num_layers = config["num_layers"]  # 保持与固定向量实验相同的 LSTM 层数。
        self.input_projection = nn.Linear(config["num_mel_bins"] * self.stack, self.hidden_size)  # 320维声音转成192维。
        self.encoder = nn.LSTM(self.hidden_size, self.hidden_size, num_layers=self.num_layers, batch_first=True)  # 读取声音序列。
        self.embedding = nn.Embedding(vocab_size, config["embedding_size"], padding_idx=PAD)  # 把前一个字查成128维向量。
        self.decoder = nn.LSTM(config["embedding_size"], self.hidden_size, num_layers=self.num_layers, batch_first=True)  # 根据文字前缀更新解码状态。
        self.query_projection = nn.Linear(self.hidden_size, self.hidden_size, bias=False)  # 学习解码状态如何查询声音位置。
        self.context_projection = nn.Linear(self.hidden_size * 2, self.hidden_size)  # 融合解码状态与本步读到的声音。
        self.output_projection = nn.Linear(self.hidden_size, vocab_size)  # 融合后预测下一个字。
        self.dropout = nn.Dropout(config.get("dropout", 0.0))  # 单层nn.LSTM自带的dropout参数不起作用，所以手动加；旧配置没有此项时为0，等于不做任何事。

    def encode(self, features, lengths):  # features 为[B,T,80]，lengths 为每条语音真实帧数。
        batch, time, bins = features.shape  # B是语音数量，T是补齐后的帧数。
        pad = (-time) % self.stack  # 补到能够按4帧分组的长度。
        frames = F.pad(features, (0, 0, 0, pad))  # 只在时间维末尾补零。
        positions = torch.arange(frames.size(1), device=features.device)  # 建立原始声音帧的位置编号。
        frame_mask = positions.unsqueeze(0) < lengths.to(features.device).unsqueeze(1)  # 标出每条语音真实存在的帧。
        frames = frames * frame_mask.unsqueeze(-1)  # 清除补齐帧，避免最后一组被无效值污染。
        stacked = frames.reshape(batch, -1, bins * self.stack)  # 每4个80维向量拼成一个320维向量。
        projected = torch.tanh(self.input_projection(stacked))  # 得到[B,声音组数,192]。
        down_lengths = (lengths + self.stack - 1) // self.stack  # 真实声音组数，向上取整。
        packed = pack_padded_sequence(projected, down_lengths.cpu(), batch_first=True, enforce_sorted=False)  # 编码器跳过末尾补齐。
        packed_outputs, state = self.encoder(packed)  # 保留每个声音位置的输出，以及最终(h,c)。
        memory, _ = pad_packed_sequence(packed_outputs, batch_first=True)  # memory[B,S,H]保存整段声音，而非只保留最后一个向量。
        memory = self.dropout(memory)  # 编码器输出dropout：Attention和CTC都读取它；eval()时自动关闭。
        valid = torch.arange(memory.size(1), device=features.device).unsqueeze(0) < down_lengths.to(features.device).unsqueeze(1)  # 注意力也必须跳过补齐位置。
        return memory, valid, state  # 整段输出供反复查询，最终(h,c)用于初始化解码器。

    def attend(self, queries, memory, valid):  # queries[B,U,H]是各文字步状态，memory[B,S,H]是声音序列。
        projected_queries = self.query_projection(queries)  # 学习把文字步状态变成声音查询向量。
        scores = torch.bmm(projected_queries, memory.transpose(1, 2)) / math.sqrt(self.hidden_size)  # 每个文字步与每个声音位置打分，得到[B,U,S]。
        scores = scores.masked_fill(~valid.unsqueeze(1), -torch.inf)  # 无效补齐位置的分数设为负无穷。
        weights = scores.softmax(dim=-1)  # 对声音位置归一化，每个文字步的有效权重之和为1。
        context = torch.bmm(weights, memory)  # 按权重读出声音，得到每个文字步自己的上下文[B,U,H]。
        return context, weights  # 同时保留权重，便于之后画对齐热力图。

    def decode(self, previous_tokens, memory, valid, state):  # 输入前面的字、整段声音及上一解码状态。
        embedded = self.dropout(self.embedding(previous_tokens))  # 文字编号变成向量[B,U,128]；dropout防止死记“前一个字是X就输出Y”。
        queries, state = self.decoder(embedded, state)  # 产生每个文字步的查询状态；h和c继续更新。
        context, weights = self.attend(queries, memory, valid)  # 每个文字步重新为声音位置分配权重。
        fused = torch.tanh(self.context_projection(torch.cat([queries, context], dim=-1)))  # 将文字状态与动态声音信息融合。
        logits = self.output_projection(self.dropout(fused))  # 输出层前再做一次dropout，然后预测各个候选字符的分数[B,U,V]。
        return logits, state, weights  # 返回分数、循环状态和注意力权重。

    def forward(self, features, lengths, decoder_inputs):  # 训练时使用右移后的正确文字作为输入。
        memory, valid, state = self.encode(features, lengths)  # 整段声音只编码一次。
        logits, _, _ = self.decode(decoder_inputs, memory, valid, state)  # 训练时可以一次计算所有文字步的注意力。
        return logits  # 与原实验使用相同的交叉熵训练接口。

    @torch.no_grad()  # 识别时不保存梯度，也不更新参数。
    def greedy_decode(self, features, lengths, max_steps=64):  # 实际识别只传声音，不传正确文字。
        memory, valid, state = self.encode(features, lengths)  # 保存整段声音供每个文字步读取。
        previous = torch.full((features.size(0), 1), BOS, device=features.device, dtype=torch.long)  # 每条语音从起始符开始。
        finished = torch.zeros(features.size(0), device=features.device, dtype=torch.bool)  # 标记已经生成结束符的语音。
        outputs = []  # 保存各步输出的字符编号。
        for _ in range(max_steps):  # 限制生成长度，避免无限输出。
            logits, state, _ = self.decode(previous, memory, valid, state)  # 根据自己上一字和动态声音上下文继续识别。
            scores = logits[:, -1].clone()  # 取得当前文字步的分数。
            scores[:, PAD] = -torch.inf  # 不允许识别结果包含补齐符。
            scores[:, BOS] = -torch.inf  # 不允许在句子中重复起始符。
            token = scores.argmax(-1)  # 每一步选择得分最高的字符。
            token = torch.where(finished, torch.full_like(token, EOS), token)  # 已结束的语音维持结束状态。
            outputs.append(token)  # 保存这一步的预测。
            finished |= token.eq(EOS)  # 新生成结束符的语音也记为结束。
            previous = token.unsqueeze(1)  # 自己预测的字成为下一步输入。
            if finished.all():  # 所有语音均结束时提前退出。
                break  # 结束解码循环。
        return torch.stack(outputs, dim=1).cpu().tolist()  # 返回编号序列，由统一评测程序计算 CER。
```


## model_lstm_attention_ctc.py 模型选择文件需要的后续模型依赖

```python
"""第四阶段：共享同一个 LSTM 编码器，同时训练 Attention 和 CTC。"""  # 这是联合训练教学模型。
import torch  # 提供张量及无梯度识别接口。
from torch import nn  # CTC 输出使用一个线性层。
from model_lstm_attention import AttentionLSTMEncoderDecoder  # 复用已经学过的注意力模型。


def collapse_ctc(paths, lengths):  # 输入逐帧CTC编号，输出原词表的字符编号。
    outputs = []  # 保存每条语音的识别结果。
    for path, length in zip(paths, lengths):  # 每条语音只读取真实声音位置。
        result, previous = [], None  # previous记录上一帧，包含blank。
        for token in path[:int(length)]:  # 忽略末尾补齐的帧。
            if token != previous and token != 0:  # 先合并相邻重复，再删除blank；顺序不能反过来。
                result.append(token + 2)  # CTC字符1对应原词表UNK3，其余字符也加2还原。
            previous = token  # blank也要更新previous，才能保留被blank隔开的重复字。
        outputs.append(result)  # 完成一条语音。
    return outputs  # 可以直接交给原有ids_to_text转换为中文。


class JointCTCAttentionLSTM(AttentionLSTMEncoderDecoder):  # 原有编解码器全部保留并参与训练。
    def __init__(self, config, vocab_size):  # 搭建原网络和新增的CTC支路。
        super().__init__(config, vocab_size)  # 创建共享编码器及Attention解码器。
        self.ctc_projection = nn.Linear(self.hidden_size, vocab_size - 2)  # CTC只含blank、UNK和普通字，不含BOS/EOS。

    def joint_forward(self, features, lengths, decoder_inputs):  # 一次编码同时服务两条支路。
        memory, valid, state = self.encode(features, lengths)  # 得到每个声音位置的表示和最终循环状态。
        attention_logits, _, _ = self.decode(decoder_inputs, memory, valid, state)  # Attention根据文字前缀预测下一字。
        ctc_logits = self.ctc_projection(memory)  # CTC直接给每个声音位置预测字符或blank。
        input_lengths = (lengths + self.stack - 1) // self.stack  # 帧拼接后，每条语音真正具有的声音位置数。
        return attention_logits, ctc_logits, input_lengths  # 两种损失最终都反传到同一个编码器。

    @torch.no_grad()  # 实际识别无需保存梯度。
    def ctc_greedy_decode(self, features, lengths):  # CTC识别只需要声音，不需要参考文字或Attention解码器。
        memory, _, _ = self.encode(features, lengths)  # 使用同一个已经联合训练的编码器。
        paths = self.ctc_projection(memory).argmax(-1).cpu().tolist()  # 各声音位置选择分数最高的候选。
        sizes = ((lengths + self.stack - 1) // self.stack).cpu().tolist()  # 删除每条语音的补齐位置。
        return collapse_ctc(paths, sizes)  # 合并重复、删除blank，得到字符序列。
```


## model_transformer_ctc.py 模型选择文件需要的后续模型依赖

```python
"""第五阶段：Transformer 编码器 + Transformer 注意力解码器 + CTC，与 LSTM 联合模型做结构对照。"""  # 教学模型，逐行中文注释。
from __future__ import annotations  # 允许在类型提示中直接写类型名称。

import math  # 计算位置编码的频率和缩放系数。
import torch  # 张量运算与自动求导。
from torch import nn  # Transformer层、线性层、嵌入层。
from torch.nn import functional as F  # 用F.pad补齐声音帧。
from data import BOS, EOS, PAD  # 特殊符号编号与其他实验相同。
from model_lstm_attention_ctc import collapse_ctc  # CTC贪心结果的“合并重复、删除blank”与LSTM版完全相同。


class PositionalEncoding(nn.Module):  # 自注意力本身不知道先后顺序，需要把“第几个位置”加进向量。
    def __init__(self, d_model: int, max_len: int = 4000):  # max_len要大于最长语音的声音位置数和最长文字数。
        super().__init__()  # 注册为PyTorch模块。
        position = torch.arange(max_len).unsqueeze(1)  # 位置编号0,1,2,...，形状[L,1]。
        frequency = torch.exp(torch.arange(0, d_model, 2) * (-math.log(10000.0) / d_model))  # 不同维度用不同频率（原论文公式）。
        table = torch.zeros(max_len, d_model)  # 位置编码表[L,D]。
        table[:, 0::2] = torch.sin(position * frequency)  # 偶数维用正弦。
        table[:, 1::2] = torch.cos(position * frequency)  # 奇数维用余弦。
        self.register_buffer("table", table, persistent=False)  # 固定的表，不是可学习参数，也不存进检查点。

    def forward(self, x):  # x为[B,T,D]。
        return x + self.table[: x.size(1)].unsqueeze(0)  # 每个位置加上自己的位置向量；batch内共用同一张表。


class JointCTCAttentionTransformer(nn.Module):  # 与JointCTCAttentionLSTM提供相同的接口，训练和评测代码可以直接复用。
    def __init__(self, config: dict, vocab_size: int):  # 搭建网络；从随机初始化开始。
        super().__init__()  # 让PyTorch管理各层参数。
        self.stack = config["stack_frames"]  # 与LSTM相同：相邻4帧拼成一个声音位置，时间分辨率40ms。
        self.d_model = config["d_model"]  # 每个位置的向量维度，例如128。
        dropout = config.get("dropout", 0.0)  # 所有dropout位置共用同一个比例。
        self.input_projection = nn.Linear(config["num_mel_bins"] * self.stack, self.d_model)  # 与LSTM相同的前端：320维拼接帧→d维。
        self.position = PositionalEncoding(self.d_model)  # 编码器和解码器共用同一张位置编码表。
        self.dropout = nn.Dropout(dropout)  # 输入和嵌入后的dropout。
        encoder_layer = nn.TransformerEncoderLayer(self.d_model, config["num_heads"], config["ffn_size"], dropout,  # 自注意力+前馈层，各自带残差连接。
                                                   batch_first=True, norm_first=True)  # 输入为[B,T,D]；先LayerNorm再计算（pre-norm），训练更稳。
        self.encoder = nn.TransformerEncoder(encoder_layer, config["encoder_layers"], norm=nn.LayerNorm(self.d_model),  # 堆叠多层编码器，最后再做一次LayerNorm。
                                             enable_nested_tensor=False)  # pre-norm下不能用嵌套张量加速，显式关闭以免警告。
        self.embedding = nn.Embedding(vocab_size, self.d_model, padding_idx=PAD)  # 把前一个字查成d维向量。
        decoder_layer = nn.TransformerDecoderLayer(self.d_model, config["num_heads"], config["ffn_size"], dropout,  # 带掩码的自注意力+读取声音的交叉注意力+前馈层。
                                                   batch_first=True, norm_first=True)  # 与编码器同样使用pre-norm。
        self.decoder = nn.TransformerDecoder(decoder_layer, config["decoder_layers"], norm=nn.LayerNorm(self.d_model))  # 堆叠多层解码器。
        self.output_projection = nn.Linear(self.d_model, vocab_size)  # Attention支路：预测下一个字。
        self.ctc_projection = nn.Linear(self.d_model, vocab_size - 2)  # CTC支路：与LSTM版相同，只含blank、UNK和普通字，不含BOS/EOS。

    def encode(self, features, lengths):  # features为[B,T,80]，lengths为每条语音真实帧数。
        batch, time, bins = features.shape  # B是语音数，T是补齐后的帧数。
        pad = (-time) % self.stack  # 补到能按4帧分组的长度。
        frames = F.pad(features, (0, 0, 0, pad))  # 只在时间维末尾补零。
        positions = torch.arange(frames.size(1), device=features.device)  # 原始帧位置编号。
        frame_mask = positions.unsqueeze(0) < lengths.to(features.device).unsqueeze(1)  # 标出真实存在的帧。
        frames = frames * frame_mask.unsqueeze(-1)  # 清除补齐帧，避免最后一组被无效值污染（与LSTM版相同）。
        stacked = frames.reshape(batch, -1, bins * self.stack)  # 每4个80维向量拼成320维。
        x = self.input_projection(stacked) * math.sqrt(self.d_model)  # 投影到d维，并按Transformer惯例放大，使其与位置编码的量级相称。
        x = self.dropout(self.position(x))  # 加上位置信息，再做dropout。
        down_lengths = (lengths + self.stack - 1) // self.stack  # 每条语音真正的声音位置数。
        valid = torch.arange(x.size(1), device=features.device).unsqueeze(0) < down_lengths.to(features.device).unsqueeze(1)  # True表示真实位置。
        memory = self.encoder(x, src_key_padding_mask=~valid)  # 自注意力只看真实位置；补齐位置不会被任何位置读取。
        return memory, valid, down_lengths  # memory[B,S,D]供解码器和CTC使用。

    def decode(self, previous_tokens, memory, valid):  # previous_tokens为[B,U]的文字前缀（以BOS开头）。
        length = previous_tokens.size(1)  # 文字步数U。
        causal = torch.triu(torch.ones(length, length, dtype=torch.bool, device=memory.device), 1)  # 上三角为True：第u步不能看到u之后的字，否则训练时等于偷看答案。
        y = self.embedding(previous_tokens) * math.sqrt(self.d_model)  # 字向量按惯例放大。
        y = self.dropout(self.position(y))  # 加位置信息，再dropout。
        hidden = self.decoder(y, memory, tgt_mask=causal,  # 带掩码的自注意力：只看已经出现的字。
                              tgt_key_padding_mask=previous_tokens.eq(PAD),  # 文字补齐位置不被读取。
                              memory_key_padding_mask=~valid)  # 交叉注意力只读取真实声音位置。
        return self.output_projection(hidden)  # 每个文字步对全部字符的分数[B,U,V]。

    def joint_forward(self, features, lengths, decoder_inputs):  # 训练和评测损失的统一入口，与LSTM版接口相同。
        memory, valid, down_lengths = self.encode(features, lengths)  # 声音只编码一次。
        attention_logits = self.decode(decoder_inputs, memory, valid)  # Attention支路：右移的正确文字作为输入（teacher forcing）。
        ctc_logits = self.ctc_projection(memory)  # CTC支路：每个声音位置预测字符或blank。
        return attention_logits, ctc_logits, down_lengths  # 长度与LSTM版一样留在CPU（CTC损失要求）；两种损失都反传到同一个编码器。

    def forward(self, features, lengths, decoder_inputs):  # 兼容只需要Attention分数的旧接口。
        return self.joint_forward(features, lengths, decoder_inputs)[0]  # 只返回Attention分数。

    @torch.no_grad()  # 识别时不保存梯度。
    def greedy_decode(self, features, lengths, max_steps=64):  # 实际识别只传声音，不传正确文字。
        memory, valid, _ = self.encode(features, lengths)  # 整段声音编码一次，之后每步重复读取。
        tokens = torch.full((features.size(0), 1), BOS, device=features.device, dtype=torch.long)  # 每条语音从起始符开始。
        finished = torch.zeros(features.size(0), device=features.device, dtype=torch.bool)  # 标记已经输出结束符的语音。
        outputs = []  # 保存每一步的输出。
        for _ in range(max_steps):  # 限制最长输出，避免无限生成。
            scores = self.decode(tokens, memory, valid)[:, -1].clone()  # 用目前已生成的全部前缀，取最后一步的分数。
            scores[:, PAD] = -torch.inf  # 不允许输出补齐符。
            scores[:, BOS] = -torch.inf  # 不允许在句中输出起始符。
            token = scores.argmax(-1)  # 每步选得分最高的字。
            token = torch.where(finished, torch.full_like(token, EOS), token)  # 已结束的语音保持EOS。
            outputs.append(token)  # 保存本步结果。
            finished |= token.eq(EOS)  # 新输出EOS的语音标记为结束。
            tokens = torch.cat([tokens, token.unsqueeze(1)], dim=1)  # 自己预测的字接到前缀后面，作为下一步输入。
            if finished.all():  # 全部结束则提前退出。
                break  # 结束解码。
        return torch.stack(outputs, dim=1).cpu().tolist()  # 返回编号序列，由统一评测程序计算CER。

    @torch.no_grad()  # 识别时不保存梯度。
    def ctc_greedy_decode(self, features, lengths):  # CTC识别只需要编码器。
        memory, _, down_lengths = self.encode(features, lengths)  # 共享编码器的输出。
        paths = self.ctc_projection(memory).argmax(-1).cpu().tolist()  # 每个声音位置选分数最高的候选。
        return collapse_ctc(paths, down_lengths.cpu().tolist())  # 合并重复、删除blank。
```
