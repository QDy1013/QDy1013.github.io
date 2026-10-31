---
title: 从零读懂普通 RNN 语音识别 从数据读取到训练与预测
date: 2026-10-31 10:00:00
permalink: 2026/10/31/rnn-asr-guide/
categories:
  - 语音识别
tags:
  - Python
  - PyTorch
  - RNN
  - ASR
  - 代码学习
---

输入一段录音，模型怎样输出对应的文字？这篇笔记沿着一条语音的处理顺序，阅读一个普通 RNN 编码器与解码器项目：先读取音频和文字清单，提取 Fbank，建立字符词表，再组成 batch、训练并独立识别。

先看 [完整源码](/2026/10/31/rnn-asr-source/)，也可以直接 [下载源码 ZIP](/downloads/rnn-asr-learning.zip)。源码保留了学习用的中文注释。本文中的“你好”、文件路径和张量尺寸示例用于解释流程，不是模型实际识别结果。

<!-- more -->

## 1 先看一条语音怎样走完整个流程

```text
音频路径清单 wav.scp + 正确文字清单 text
                 ↓ 按录音编号配对并筛选
        选中样本的路径、文字和元信息
                 ↓ 读取 WAV 采样值
           Fbank 声音特征矩阵
                 ↓ 使用训练集统计归一化
     声音特征 + 文字编号 → 组成一个 batch
                 ↓
             RNN 编码器
                 ↓ 固定声音向量 context
             RNN 解码器
                 ↓ 给每个候选符号打分
     训练：与正确文字比较，更新网络参数
     识别：逐字选择，直到结束符或达到步数上限
```

编码器和解码器是两个独立的普通 tanh RNN。它们分别读取声音和生成文字，通过编码器最终状态连接。这里使用固定声音向量，没有注意力。阅读时，先记住每一步的输入和输出，再逐行理解语法。

| 文件 | 主要负责什么 |
| --- | --- |
| `config.json` | 数据路径、样本数量和模型尺寸等配置 |
| `data.py` | 读取清单、选样、提取 Fbank、建词表和整理 batch |
| `model.py` | 普通 RNN 编码器、解码器和贪心识别 |
| `train.py` | 组织数据、训练、验证、选优和保存 |
| `training_steps.py` | 计算损失、反向传播和参数更新 |
| `predict.py` | 加载权重，识别一条新录音 |
| `metrics.py`、`report.py` | 计算字错误率、生成报告 |
| `test_core.py` | 检查标签错位、补齐处理和梯度等关键行为 |

## 2 读取清单 先拿到路径和文字

### 2.1 wav.scp 里面不是声音

先看两份 UTF-8 文本文件。音频路径清单 `wav.scp` 的内容类似：

```text
utt001 /data/audio/speaker01/001.wav
utt002 /data/audio/speaker01/002.wav
```

文字清单 `text` 的内容类似：

```text
utt001 你好
utt002 今天天气不错
```

两份文件用同一个录音编号建立对应关系。此时程序读到的是路径字符串与文字，还没有读出 WAV 里的采样值。

### 2.2 read_mapping 把文本变成字典

```python
def read_mapping(path: Path) -> dict[str, str]:
    result = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.split(maxsplit=1)
        if len(parts) == 2:
            if parts[0] in result:
                raise ValueError(f"Duplicate utterance ID in {path}: {parts[0]}")
            result[parts[0]] = parts[1]
    return result
```

`path: Path` 是参数的类型提示，`-> dict[str, str]` 表示返回字典，键和值都是字符串。`read_text` 读取整个文本，`splitlines` 按行拆开，`for` 每次取出一行。

例如 `"utt001 你 好".split(maxsplit=1)` 得到 `["utt001", "你 好"]`。最多拆一次，才能把第一个编号与后面的完整内容分开。`result[parts[0]] = parts[1]` 将它保存成字典中的一项；重复编号会抛错，避免悄悄覆盖旧记录。

读取两份清单后，可以得到：

```python
paths = {"utt001": "/data/audio/speaker01/001.wav"}
texts = {"utt001": "你好"}
```

### 2.3 select_split 挑选符合规则的样本

```python
def select_split(config: dict, split: str, count: int, seed: int) -> list[dict]:
```

四个参数分别是筛选配置、数据划分名称、样本数量和随机种子。例如 `select_split(config, "train", 128, 42)`，表示从已经准备好的训练集中，按配置筛选 128 条样本。

这里的 `split` 是已划分的 `train`、`dev` 或 `test`，函数本身不负责重新分割整个语料。

```python
ids = sorted(set(paths) & set(texts))
random.Random(seed).shuffle(ids)
```

`set(paths)` 从字典取出键，也就是录音编号；`&` 取音频与文字都有的编号；`sorted` 先排成列表，再用随机种子打乱。相同输入与种子，在相同运行环境下可复现这个选样顺序。

接下来检查文字长度、文件存在性、采样率、声道、采样宽度和时长。返回的是一个列表，其中每个字典保存一条语音的信息：

```python
{
    "id": "utt001",
    "wav": "/data/audio/speaker01/001.wav",
    "text": "你好",
    "seconds": 1.5,
    "speaker": "speaker01"
}
```

`speaker` 使用 WAV 父文件夹名。因此数据必须按预期保存说话人目录；本项目还会检查 train、dev、test 的编号和说话人是否重叠。

`count=128` 时，选够即返回，不够就报错。`count=0` 是项目约定，表示检查全部样本。如果同时要求 `require_complete=True`，音频与文字编号需要完全对应，全量选样也不能悄悄丢掉检查失败的样本。

## 3 真正读取声音 并提取 Fbank

### 3.1 wave 负责从 WAV 取得采样值字节

```python
with wave.open(path, "rb") as audio:
    pcm = np.frombuffer(
        audio.readframes(audio.getnframes()), dtype="<i2"
    ).copy()
waveform = torch.from_numpy(pcm).float().unsqueeze(0)
```

这里展示核心读取步骤，完整函数还有格式检查。`with` 在代码块结束后自动关闭文件，`"rb"` 表示二进制读取。`readframes` 返回字节，NumPy 将其解释成小端 16 位有符号采样值，再转换成张量。

`unsqueeze(0)` 为一维采样序列增加声道维度，得到 `[1, 采样点数]`。这是声音波形，不是字符编号。

### 3.2 torchaudio 把波形变成 Fbank 矩阵

```python
features = torchaudio.compliance.kaldi.fbank(
    waveform,
    sample_frequency=config["sample_rate"],
    num_mel_bins=config["num_mel_bins"],
    frame_length=config["frame_length"],
    frame_shift=config["frame_shift"],
    dither=0.0,
    energy_floor=0.0,
)
```

基础配置使用 16 kHz 波形、25 ms 帧长、10 ms 帧移，每帧 80 维。整条语音得到 `[T, 80]`，`T` 随录音长度变化。

这个项目要求单声道 16-bit PCM WAV，并检查配置中的采样率。它不会在格式不匹配时自动重采样。`fbank_for_file` 接收音频路径和配置，返回声音特征张量。

## 4 文字变编号 声音做归一化

### 4.1 词表中的位置就是编号

```python
PAD, BOS, EOS, UNK = 0, 1, 2, 3
SPECIAL = ["<pad>", "<bos>", "<eos>", "<unk>"]
vocab = SPECIAL + sorted({ch for s in splits["train"] for ch in s["text"]})
stoi = {ch: i for i, ch in enumerate(vocab)}
```

前四个编号分别保留给补齐、开始、结束和未知字符。后面接训练文字出现过的字符。实际顺序由排序确定，词表大小随训练数据变化；源码旧注释中的某次词表大小不应当作固定模型常量。

假设某个示例词表中“你”为 4、“好”为 5，文字就能变成 `[4, 5]`。验证和测试遇到词表外字符，会转换成 `UNK`，但计算 CER 时仍与原始参考文字比较，不会删掉这些字符。

### 4.2 用训练集统计处理三个划分

```text
归一化特征 = (原始特征 - 训练集均值) / 训练集标准差
```

代码逐频带累计训练集的和、平方和及帧数，计算均值与标准差。dev 与 test 使用同一组训练统计，不能把它们混进统计来使验证结果变好。

小样本配置把特征存内存；全量配置逐条保存到磁盘，在取样时读取并归一化。缓存签名检查的是选样与特征提取配置，它不是音频内容的完整性校验；原文件变了却没改配置时，不能单靠这个签名发现变化。

## 5 Dataset 和 collate 组成一个 batch

`SpeechDataset` 告诉 DataLoader 有多少条样本，以及怎样按下标取出一条。它的 `__len__` 返回数量，`__getitem__` 返回样本。

不同语音长度不一样，`collate` 把它们补到本批最长长度：

| 字段 | 张量形状 | 含义 |
| --- | --- | --- |
| `features` | `[B, T, 80]` | B 条声音特征 |
| `lengths` | `[B]` | 每条语音补齐前的帧数 |
| `decoder_inputs` | `[B, U]` | 给解码器的文字编号 |
| `targets` | `[B, U]` | 对应位置的正确目标编号 |

### 5.1 输入文字与目标错开一位

```text
正确文字：      你    好
解码器输入： BOS    你    好
对应目标：    你    好   EOS
```

模型收到开始符时预测“你”，收到“你”时预测“好”，收到“好”时预测结束。这叫 teacher forcing：训练阶段使用前一个正确字符。当前要预测的答案放在 targets，不能直接作为当前输入。

较短文字用 PAD 补齐。计算损失时忽略 PAD，编码声音时则依靠真实长度跳过补齐组，这两者处理的是不同的补齐问题。

## 6 普通 RNN 编码器怎样读声音

基础配置中，声音形状按下面顺序变化：

```text
[B, T, 80]
    ↓ 每 4 帧拼成一组
[B, ceil(T/4), 320]
    ↓ 线性投影与 tanh
[B, ceil(T/4), 192]
    ↓ RNN 编码器
hidden: [K, B, 192]
context = hidden[-1]: [B, 192]
```

其中 K 是网络层数，基础配置为 1。`hidden[-1]` 选取最后一层；RNN 返回的 hidden 本身已经是各层最终时刻的状态。

最后一个拼帧组可能混有补齐帧，因此代码先按真实长度将这些位置清零，再用 `pack_padded_sequence` 指定每条语音的有效组数。这样短录音不会继续把整组补齐当成声音读进去。

编码器读完整条语音后返回 `context` 与 `hidden`：前者供解码器每一步读取，后者初始化解码器状态。基础单层设置中它们来自同一份最终记忆，但在后续解码中，context 保持固定，解码器 hidden 会持续更新。

## 7 解码器怎样预测下一个字符

```text
前一个字的编号
    ↓ Embedding
128 维文字向量 + 192 维固定声音向量
    ↓ 拼接成 320 维输入
解码器 RNN 更新自己的状态
    ↓ 线性输出层
词表大小 V 个分数
```

声音 Fbank 不经过文字 Embedding。Embedding 用来将整数文字编号换成可训练向量。

`decode` 返回的 logits 是原始分数，不是文字，也不要求提前 softmax 再传给交叉熵。`forward` 串起这两部分：

```python
def forward(self, features, lengths, decoder_inputs):
    context, hidden = self.encode(features, lengths)
    logits, _ = self.decode(decoder_inputs, context, hidden)
    return logits
```

这个 forward 负责计算分数。反向传播和参数更新放在训练代码中。

## 8 一次训练怎样更新参数

普通 RNN 的训练路径是：

```text
清空旧梯度
    ↓
前向计算 logits
    ↓
交叉熵比较 logits 与 targets 忽略 PAD
    ↓
loss.backward 计算并累积梯度
    ↓
裁剪梯度
    ↓
optimizer.step 用 Adam 更新参数
```

`training_steps.py` 支持将一个有效 batch 分成显存小批次。每块损失按整个有效 batch 的非 PAD 目标数归一化；全部小块求完梯度后，才裁剪并更新一次。文字长度不同，不能简单平均各小块自己的均值损失。

`train.py` 组织训练轮次，按配置评测 dev 和固定的一小部分训练语音。`train_probe_cer` 是训练探针，不能当作整个训练集 CER。最终评测才遍历全部选中 train、dev 和 test 样本。

选优先比较 dev CER，再比较 dev loss。`best.pt` 保存最佳模型，`last.pt` 则包括优化器和随机状态等续训信息，因此最后一轮不一定就是最终报告使用的模型。

## 9 真正识别时 没有正确文字可用

```text
输入声音 编码一次
    ↓
给解码器 BOS
    ↓
选择本步分数最高的允许符号
    ↓
把刚选出的符号当作下一步输入
    ↓
生成 EOS 或达到最大步数时结束
```

`greedy_decode` 屏蔽 PAD 与 BOS，不让它们被输出；EOS 可以被选中。同一批语音可以在不同时间结束。最后 `ids_to_text` 通过词表还原字符，遇到 EOS 停止，UNK 显示为方框。

这也是为什么训练 loss 下降不一定说明实际识别已经很好：训练时会给正确前缀，独立识别时只能使用自己先前预测的字符。

## 10 CER 怎样计算

字错误率 CER 使用参考文字与预测文字之间的编辑错误数：

```text
CER = 总编辑错误数 / 参考文字总字符数
```

编辑操作包括替换、删除和插入。项目的 `edit_distance` 用动态规划求最少操作数，再在 `summarize` 中按所有参考字符累计。不能先逐句求 CER 再简单平均，两个结果一般不同。

例如参考是“你好”，预测是“您好”，需要替换一个字，CER 为 1/2。插入文字很多时 CER 也可能超过 100%。

## 11 怎样运行完整项目

### 11.1 准备数据与环境

下载并解压文首源码 ZIP，进入 `rnn-asr-learning`。需要 Python、NumPy 和匹配版本的 PyTorch 与 torchaudio。本文本次验证使用已有 Python 3.12、torch 2.11.0、torchaudio 2.11.0 环境；安装时按自己的 CPU/GPU 选择 [PyTorch 官方安装方式](https://pytorch.org/get-started/locally/)。

数据根目录需要包含：

```text
DATA_DIR/
├── train/
│   ├── wav.scp
│   └── text
├── dev/
│   ├── wav.scp
│   └── text
└── test/
    ├── wav.scp
    └── text
```

音频位于 wav.scp 指向的位置。清单可以用绝对路径，也可以用相对该划分目录的路径；不支持把 shell 管道命令当成音频路径。

### 11.2 核心检查 数据准备 训练

下方 `DATA_DIR` 与 `AUDIO.wav` 是占位符，运行前换成真实路径。含空格的路径加引号。

```bash
python test_core.py
python train.py --data-dir DATA_DIR --output runs/rnn_blog --prepare-only
python train.py --data-dir DATA_DIR --output runs/rnn_blog --epochs 10 --device cpu
```

默认配置选择 128 条训练、32 条验证与 32 条测试语音，并限定时长和文字长度。样本不足会报错；先核对数据与筛选条件，而不是随便删掉检查。使用 GPU 时将 `--device cpu` 改成 `--device cuda`。

默认配置和原 WSL 启动器保留原实验路径。公开运行时应显式传 `--data-dir` 和新的 `--output`；这些参数会覆盖相应默认值。

### 11.3 续训和单条识别

```bash
python train.py --data-dir DATA_DIR --output runs/rnn_blog --epochs 60 --device cpu --resume
python predict.py runs/rnn_blog/best.pt AUDIO.wav
```

`--epochs 60` 表示总目标 60 轮；如果已有 10 轮，就从下一轮继续到 60，而不是额外再训 60 轮。识别时重用检查点保存的词表、均值和标准差。

### 11.4 查看哪些输出

| 文件 | 内容 |
| --- | --- |
| `vocab.json` | 字符词表 |
| `train.jsonl` 等 | 选中的样本清单 |
| `history.json` 与 `history.csv` | 轮次、损失与验证结果 |
| `predictions_test.json` 等 | 正确文字、独立预测及编辑错误 |
| `best.pt` 与 `last.pt` | 选优权重与续训检查点 |
| `experiment_report.html` | 训练曲线、CER 和识别样例 |

## 12 源码附件怎样阅读

先读 `data.py` 中的 `read_mapping`、`select_split`、`fbank_for_file`，再看 `prepare_dataset`、`SpeechDataset` 和 `collate`。接着读 `model.py` 的编码、解码和独立识别，最后进入训练入口。

附件还保留四个后续模型文件，因为共享的 `models.py` 会导入它们。默认配置未写 model_type 时选择普通 RNN；这些依赖存在，并不表示当前模型使用了 LSTM 或 Transformer。完整 CTC 训练入口不在这个 RNN 附件的运行范围内。

这份模型用于理解语音识别的代码流程。源码附件不包含 AISHELL 语料和已有权重，文章也不把流程测试作为真实识别效果。若要讨论识别性能，需要另行报告真实语料上的配置、训练预算、dev 选优和 test 结果。

继续阅读：[所有源码与配置](/2026/10/31/rnn-asr-source/) · [下载源码 ZIP](/downloads/rnn-asr-learning.zip)
