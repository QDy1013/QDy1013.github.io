---
title: ACM 算法板子合集（59 份）
date: 2026-10-22 20:00:00
featured: true
categories:
  - 算法
tags:
  - ACM
  - 算法模板
  - C++
---

这是我整理的考场算法代码本：每一份板子都提炼自我在洛谷上已经 AC 的题目，整理成可以直接调用的函数、类和框架，并写明了用途、适用条件、复杂度和调用方式。一共 59 份，分成数论、数据结构、图论、搜索与贪心、动态规划五大类。

<!-- more -->

> **使用约定**
> - 源码使用 C++17，`int` 管下标，`ll` 管数值。
> - 所有板子共用下面开场骨架里的 `ll` 和 `INF`。除另有说明，数组零下标且非空，区间为闭区间。
> - 板子由 AC 代码提炼改写，整理后没有逐一重新编译和对拍，使用前建议先自测。

## 🚀 开场骨架

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll INF = (1LL << 60);

// 将需要的模板放在 solve() 外；值与下标类型按题目调整。
void solve() {
    // 读入数据、调用模板、输出答案。
}
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T=1;
    // cin >> T;
    while (T--) solve();
}
```

## 📑 目录

<div class="board-grid"><div class="board-group"><div class="board-group-head"><span class="board-emoji">🔢</span><span class="board-name">排序与数论</span><span class="board-count">7 份</span></div><div class="board-chips"><a class="board-chip" href="#01-归并排序"><span class="board-no">01</span>归并排序</a><a class="board-chip" href="#02-模快速幂"><span class="board-no">02</span>模快速幂</a><a class="board-chip" href="#03-扩展欧几里得与线性同余"><span class="board-no">03</span>扩展欧几里得与线性同余</a><a class="board-chip" href="#04-线性筛与莫比乌斯反演"><span class="board-no">04</span>线性筛与莫比乌斯反演</a><a class="board-chip" href="#05-试除分解与约数个数"><span class="board-no">05</span>试除分解与约数个数</a><a class="board-chip" href="#06-异或线性基"><span class="board-no">06</span>异或线性基</a><a class="board-chip" href="#07-带位置的前缀线性基"><span class="board-no">07</span>带位置的前缀线性基</a></div></div><div class="board-group"><div class="board-group-head"><span class="board-emoji">🌲</span><span class="board-name">数据结构</span><span class="board-count">15 份</span></div><div class="board-chips"><a class="board-chip" href="#08-树状数组：和、差分、第-k-小"><span class="board-no">08</span>树状数组：和、差分、第 k 小</a><a class="board-chip" href="#09-区间乘加与区间和"><span class="board-no">09</span>区间乘加与区间和</a><a class="board-chip" href="#10-区间赋值、区间加、最大值"><span class="board-no">10</span>区间赋值、区间加、最大值</a><a class="board-chip" href="#11-线段树合并信息：最大子段与交替段"><span class="board-no">11</span>线段树合并信息：最大子段与交替段</a><a class="board-chip" href="#12-01-覆盖、翻转与最长连续段"><span class="board-no">12</span>01 覆盖、翻转与最长连续段</a><a class="board-chip" href="#13-区间加的平方和与方差"><span class="board-no">13</span>区间加的平方和与方差</a><a class="board-chip" href="#14-主席树：区间第-k-小"><span class="board-no">14</span>主席树：区间第 k 小</a><a class="board-chip" href="#15-可持久化数组"><span class="board-no">15</span>可持久化数组</a><a class="board-chip" href="#16-Trie-前缀计数"><span class="board-no">16</span>Trie 前缀计数</a><a class="board-chip" href="#17-multiset-滑动窗口最值"><span class="board-no">17</span>multiset 滑动窗口最值</a><a class="board-chip" href="#24-离线区间不同数"><span class="board-no">24</span>离线区间不同数</a><a class="board-chip" href="#26-单调栈：直方图面积与矩形计数"><span class="board-no">26</span>单调栈：直方图面积与矩形计数</a><a class="board-chip" href="#27-回滚莫队的删除框架"><span class="board-no">27</span>回滚莫队的删除框架</a><a class="board-chip" href="#56-开方线段树与稳定区间剪枝"><span class="board-no">56</span>开方线段树与稳定区间剪枝</a><a class="board-chip" href="#58-对顶堆动态分位数"><span class="board-no">58</span>对顶堆动态分位数</a></div></div><div class="board-group"><div class="board-group-head"><span class="board-emoji">🕸️</span><span class="board-name">图论与树</span><span class="board-count">6 份</span></div><div class="board-chips"><a class="board-chip" href="#18-并查集与-Kruskal"><span class="board-no">18</span>并查集与 Kruskal</a><a class="board-chip" href="#19-倍增-LCA-与树上点差分"><span class="board-no">19</span>倍增 LCA 与树上点差分</a><a class="board-chip" href="#20-Tarjan-强连通分量与缩点"><span class="board-no">20</span>Tarjan 强连通分量与缩点</a><a class="board-chip" href="#21-二分图最大匹配：增广路"><span class="board-no">21</span>二分图最大匹配：增广路</a><a class="board-chip" href="#22-树的重心与树的直径"><span class="board-no">22</span>树的重心与树的直径</a><a class="board-chip" href="#23-函数跳转倍增"><span class="board-no">23</span>函数跳转倍增</a></div></div><div class="board-group"><div class="board-group-head"><span class="board-emoji">🔍</span><span class="board-name">搜索、分治、贪心与计算几何</span><span class="board-count">6 份</span></div><div class="board-chips"><a class="board-chip" href="#25-三维偏序-CDQ"><span class="board-no">25</span>三维偏序 CDQ</a><a class="board-chip" href="#28-k-叉-Huffman-与截止时间反悔贪心"><span class="board-no">28</span>k 叉 Huffman 与截止时间反悔贪心</a><a class="board-chip" href="#29-多路归并与整体增量"><span class="board-no">29</span>多路归并与整体增量</a><a class="board-chip" href="#30-Andrew-凸包与周长"><span class="board-no">30</span>Andrew 凸包与周长</a><a class="board-chip" href="#57-BFS-最短步数与-DFS-路径回溯"><span class="board-no">57</span>BFS 最短步数与 DFS 路径回溯</a><a class="board-chip" href="#59-最小圆覆盖、二分半径与贪心分段"><span class="board-no">59</span>最小圆覆盖、二分半径与贪心分段</a></div></div><div class="board-group"><div class="board-group-head"><span class="board-emoji">🧮</span><span class="board-name">动态规划</span><span class="board-count">25 份</span></div><div class="board-chips"><a class="board-chip" href="#31-最大子段和与数字三角形"><span class="board-no">31</span>最大子段和与数字三角形</a><a class="board-chip" href="#32-树状数组优化-LIS、双向-LIS-与排列-LCS"><span class="board-no">32</span>树状数组优化 LIS、双向 LIS 与排列 LCS</a><a class="board-chip" href="#33-01-背包与增量收益"><span class="board-no">33</span>01 背包与增量收益</a><a class="board-chip" href="#34-完全背包：最少个数、组合数、排列数"><span class="board-no">34</span>完全背包：最少个数、组合数、排列数</a><a class="board-chip" href="#35-混合背包与依赖分组背包"><span class="board-no">35</span>混合背包与依赖分组背包</a><a class="board-chip" href="#36-负权-01-背包"><span class="board-no">36</span>负权 01 背包</a><a class="board-chip" href="#37-同步双路径取数"><span class="board-no">37</span>同步双路径取数</a><a class="board-chip" href="#38-四种卡牌计数状态"><span class="board-no">38</span>四种卡牌计数状态</a><a class="board-chip" href="#39-路径上增加资源次数维"><span class="board-no">39</span>路径上增加资源次数维</a><a class="board-chip" href="#40-编辑距离与带权序列对齐"><span class="board-no">40</span>编辑距离与带权序列对齐</a><a class="board-chip" href="#41-子串分段计数"><span class="board-no">41</span>子串分段计数</a><a class="board-chip" href="#42-石子合并：线性与环形"><span class="board-no">42</span>石子合并：线性与环形</a><a class="board-chip" href="#43-能量项链与带操作数的区间-DP"><span class="board-no">43</span>能量项链与带操作数的区间 DP</a><a class="board-chip" href="#44-涂色与回文"><span class="board-no">44</span>涂色与回文</a><a class="board-chip" href="#45-区间端点状态计数"><span class="board-no">45</span>区间端点状态计数</a><a class="board-chip" href="#46-文法合并可行性"><span class="board-no">46</span>文法合并可行性</a><a class="board-chip" href="#47-树形-DP：独立集"><span class="board-no">47</span>树形 DP：独立集</a><a class="board-chip" href="#48-树形背包：前置依赖与精确数量"><span class="board-no">48</span>树形背包：前置依赖与精确数量</a><a class="board-chip" href="#49-DAG-最长路径、计数与记忆化"><span class="board-no">49</span>DAG 最长路径、计数与记忆化</a><a class="board-chip" href="#50-等差子序列计数与进出栈方案"><span class="board-no">50</span>等差子序列计数与进出栈方案</a><a class="board-chip" href="#51-有序集合优化滑窗转移"><span class="board-no">51</span>有序集合优化滑窗转移</a><a class="board-chip" href="#52-堆优化带偏移的窗口转移"><span class="board-no">52</span>堆优化带偏移的窗口转移</a><a class="board-chip" href="#53-按位优化子序列转移"><span class="board-no">53</span>按位优化子序列转移</a><a class="board-chip" href="#54-保序选择与方案恢复"><span class="board-no">54</span>保序选择与方案恢复</a><a class="board-chip" href="#55-改变状态：合并值到最早右端点"><span class="board-no">55</span>改变状态：合并值到最早右端点</a></div></div></div>

## 🔢 排序与数论

### 01 归并排序

来源：P1177。输入零下标数组，原地升序排序。

时间 $\mathcal{O}(n \log n)$，空间 $\mathcal{O}(n)$。

空数组直接返回；相等时先取左边，保持稳定。
```cpp
void merge_sort(vector<int>& a) {
    vector<int> b(a.size());
    function<void(int,int)> go = [&](int l,int r) {
        if (l >= r) return;
        int m = (l+r)/2;
        go(l,m); go(m+1,r);
        int i=l, j=m+1, k=l;
        while (i<=m && j<=r)
            b[k++] = a[i]<=a[j] ? a[i++] : a[j++];
        while (i<=m) b[k++]=a[i++];
        while (j<=r) b[k++]=a[j++];
        for (int p=l;p<=r;p++) a[p]=b[p];
    };
    if (!a.empty()) go(0,(int)a.size()-1);
}
```

### 02 模快速幂

来源：P1226。qpow(a,b,p) 求 a^b mod p。

时间 $\mathcal{O}(\log b)$，空间 $\mathcal{O}(1)$。

要求 b>=0、p>=1；p<=1e9 时 ll 乘法安全。
```cpp
ll qpow(ll a,ll b,ll p) {
    a=(a%p+p)%p;
    ll ans=1%p;
    while (b) {
        if (b&1) ans=ans*a%p;
        a=a*a%p;
        b>>=1;
    }
    return ans;
}
```

### 03 扩展欧几里得与线性同余

来源：P1516。解 a*x=b (mod m)，返回最小非负解及解的周期。

时间 $\mathcal{O}(\log m)$，递归空间 $\mathcal{O}(\log m)$。

m>0；无解返回 {-1,0}；缩放乘积须不超过 ll。
```cpp
ll exgcd(ll a,ll b,ll& x,ll& y) {
    if (!b) { x=1; y=0; return a; }
    ll d=exgcd(b,a%b,y,x);
    y-=a/b*x;
    return d;
}
pair<ll,ll> congruence(ll a,ll b,ll m) {
    a=(a%m+m)%m;
    ll x,y,d=exgcd(a,m,x,y);
    if (b%d) return {-1,0};
    ll period=m/d;
    x=x*(b/d)%period;
    x=(x+period)%period;
    return {x,period};
}
// 青蛙：(m-n)*t = y-x (mod L)。
```

### 04 线性筛与莫比乌斯反演

来源：P3383 / P1390。筛素数与 mu；gcd_sum(n) 求 1<=i<j<=n 的 gcd 和。

筛 $\mathcal{O}(n)$；所给双重求和 $\mathcal{O}(n \log n)$。

mu[1]=1；先筛到 n；计数与答案使用 ll。
```cpp
struct Sieve {
    vector<int> prime,mu,vis;
    Sieve(int n):mu(n+1),vis(n+1) {
        mu[1]=1;
        for (int i=2;i<=n;i++) {
            if (!vis[i]) prime.push_back(i),mu[i]=-1;
            for (int p:prime) {
                if (1LL*i*p>n) break;
                vis[i*p]=1;
                if (i%p==0) { mu[i*p]=0; break; }
                mu[i*p]=-mu[i];
            }
        }
    }
    ll gcd_sum(int n) {
        ll ans=0;
        for (int k=1;k<=n;k++) {
            int t=n/k;
            for (int d=1;d<=t;d++)
                ans+=1LL*k*mu[d]*(t/d)*(t/d);
        }
        return (ans-1LL*n*(n+1)/2)/2;
    }
};
```

### 05 试除分解与约数个数

来源：P9836。返回质因子及指数；约数个数为所有 (指数+1) 的乘积。

试除 $\mathcal{O}(\sqrt{n})$，额外空间 $\mathcal{O}(\log n)$。

n>=1；p<=n/p 避免 p*p 溢出。
```cpp
vector<pair<ll,int>> factor(ll n) {
    vector<pair<ll,int>> ans;
    for (ll p=2;p<=n/p;p++) {
        if (n%p) continue;
        int cnt=0;
        while (n%p==0) n/=p,cnt++;
        ans.push_back({p,cnt});
    }
    if (n>1) ans.push_back({n,1});
    return ans;
}
ll divisor_count(ll n) {
    ll ans=1;
    for (auto [p,c]:factor(n)) ans*=c+1;
    return ans;
}
```

### 06 异或线性基

来源：P3812。逐个插入非负数，求任意子集的最大异或值。

每次插入、查询 $\mathcal{O}(63)$，空间 $\mathcal{O}(63)$。

仅处理非负 ll，即第 0..62 位。
```cpp
struct Basis {
    ll d[63]{};
    void insert(ll x) {
        for (int b=62;b>=0;b--) {
            if (!(x>>b&1)) continue;
            if (!d[b]) { d[b]=x; return; }
            x^=d[b];
        }
    }
    ll maximum() const {
        ll ans=0;
        for (int b=62;b>=0;b--)
            ans=max(ans,ans^d[b]);
        return ans;
    }
};
```

### 07 带位置的前缀线性基

来源：P17146。依次 append(a[i]) 后，query(l,r) 求区间子集最大异或。

建表 $\mathcal{O}(63n)$，查询 $\mathcal{O}(63)$，空间 $\mathcal{O}(63n)$。

数组一下标；非负 ll。每个基向量保留尽量靠后的下标。
```cpp
struct RangeBasis {
    struct Node { ll d[63]{}; int pos[63]{}; };
    vector<Node> pre=vector<Node>(1);
    void append(ll x) {
        int at=pre.size();
        pre.push_back(pre.back());
        auto& t=pre.back();
        for (int b=62;b>=0;b--) {
            if (!(x>>b&1)) continue;
            if (!t.d[b]) {
                t.d[b]=x; t.pos[b]=at; break;
            }
            if (t.pos[b]<at) {
                swap(t.pos[b],at); swap(t.d[b],x);
            }
            x^=t.d[b];
        }
    }
    ll query(int l,int r) const {
        ll ans=0;
        for (int b=62;b>=0;b--)
            if (pre[r].pos[b]>=l)
                ans=max(ans,ans^pre[r].d[b]);
        return ans;
    }
};
```

## 🌲 数据结构

### 08 树状数组：和、差分、第 k 小

来源：P3374 / P3368 / P1168 / P1801。单点加、前缀和；差分下实现区间加单点查；频率求排名。

更新、前缀 $\mathcal{O}(\log n)$；所给二分第 k 小 $\mathcal{O}(\log^2 n)$。

下标从 1 开始；kth 要求频率非负且 1<=k<=sum(n)。
```cpp
struct BIT {
    int n; vector<ll> t;
    BIT(int n):n(n),t(n+1) {}
    void add(int x,ll v) {
        for (;x<=n;x+=x&-x) t[x]+=v;
    }
    ll sum(int x) const {
        ll s=0;
        for (;x;x-=x&-x) s+=t[x];
        return s;
    }
    ll range(int l,int r) const {
        return sum(r)-sum(l-1);
    }
    int kth(ll k) const {
        int l=1,r=n;
        while (l<r) {
            int m=(l+r)/2;
            if (sum(m)>=k) r=m; else l=m+1;
        }
        return l;
    }
    void range_add(int l,int r,ll v) {
        add(l,v); if (r<n) add(r+1,-v);
    }
};
// 差分建树：add(i,a[i]-a[i-1]); 点值 sum(i)。
// 离散化：sort/unique 后 lower_bound()+1。
```

### 09 区间乘加与区间和

来源：P3372 / P3373。AffineSeg(a,mod)，a 为零下标；change(l,r,m,b) 令 x=m*x+b。

建树 $\mathcal{O}(n)$，区间修改、查询 $\mathcal{O}(\log n)$。

n>=1；以下 ll 实现要求 mod<=1e9，参数先归一化。
```cpp
struct AffineSeg {
    int n; ll mod;
    vector<ll> s,mul,inc;
    AffineSeg(vector<ll> a,ll p):n(a.size()),mod(p),
        s(4*n),mul(4*n,1),inc(4*n) {
        function<void(int,int,int)> build=
        [&](int o,int l,int r) {
            if (l==r) { s[o]=(a[l]%p+p)%p; return; }
            int m=(l+r)/2;
            build(o*2,l,m); build(o*2+1,m+1,r);
            s[o]=(s[o*2]+s[o*2+1])%mod;
        }; build(1,0,n-1);
    }
    void apply(int o,int len,ll m,ll b) {
        s[o]=(s[o]*m+len*b)%mod;
        mul[o]=mul[o]*m%mod;
        inc[o]=(inc[o]*m+b)%mod;
    }
    void push(int o,int l,int r) {
        int m=(l+r)/2;
        apply(o*2,m-l+1,mul[o],inc[o]);
        apply(o*2+1,r-m,mul[o],inc[o]);
        mul[o]=1; inc[o]=0;
    }
    void change(int L,int R,ll a,ll b) {
        a=(a%mod+mod)%mod; b=(b%mod+mod)%mod;
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (L<=l&&r<=R) {
                apply(o,r-l+1,a,b); return;
            }
            push(o,l,r); int m=(l+r)/2;
            if (L<=m) go(o*2,l,m);
            if (R>m) go(o*2+1,m+1,r);
            s[o]=(s[o*2]+s[o*2+1])%mod;
        }; go(1,0,n-1);
    }
    ll query(int L,int R) {
        function<ll(int,int,int)> go=
        [&](int o,int l,int r)->ll {
            if (L<=l&&r<=R) return s[o];
            push(o,l,r); int m=(l+r)/2; ll ans=0;
            if (L<=m) ans+=go(o*2,l,m);
            if (R>m) ans+=go(o*2+1,m+1,r);
            return ans%mod;
        }; return go(1,0,n-1);
    }
};
// 加 v: change(l,r,1,v)；乘 v: (v,0)。
// 覆盖 v: (0,v)。复合顺序：新变换乘在旧变换之后。
```

### 10 区间赋值、区间加、最大值

来源：P1253。TagMax(a)；modify(l,r,v,true) 覆盖，false 表示加。

建树 $\mathcal{O}(n)$，操作 $\mathcal{O}(\log n)$。

赋值必须另有 has 标记，不能拿 0 当作没有赋值。
```cpp
struct TagMax {
    int n; vector<ll> mx,setv,add;
    vector<bool> has;
    TagMax(vector<ll> a):n(a.size()),mx(4*n),
        setv(4*n),add(4*n),has(4*n) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (l==r) { mx[o]=a[l]; return; }
            int m=(l+r)/2; go(o*2,l,m);
            go(o*2+1,m+1,r); pull(o);
        }; go(1,0,n-1);
    }
    void pull(int o) { mx[o]=max(mx[o*2],mx[o*2+1]); }
    void cover(int o,ll v) {
        mx[o]=setv[o]=v; has[o]=true; add[o]=0;
    }
    void plus(int o,ll v) { mx[o]+=v; add[o]+=v; }
    void push(int o) {
        for (int c:{o*2,o*2+1}) {
            if (has[o]) cover(c,setv[o]);
            if (add[o]) plus(c,add[o]);
        }
        has[o]=false; add[o]=0;
    }
    void modify(int L,int R,ll v,bool is_set) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (L<=l&&r<=R) {
                if (is_set) cover(o,v); else plus(o,v);
                return;
            }
            push(o); int m=(l+r)/2;
            if (L<=m) go(o*2,l,m);
            if (R>m) go(o*2+1,m+1,r); pull(o);
        }; go(1,0,n-1);
    }
    ll query(int L,int R) {
        function<ll(int,int,int)> go=
        [&](int o,int l,int r)->ll {
            if (L<=l&&r<=R) return mx[o];
            push(o); int m=(l+r)/2; ll ans=-INF;
            if (L<=m) ans=max(ans,go(o*2,l,m));
            if (R>m) ans=max(ans,go(o*2+1,m+1,r));
            return ans;
        }; return go(1,0,n-1);
    }
};
```

### 11 线段树合并信息：最大子段与交替段

来源：P4513 / P1714 / P6492。完整通用单点树加两套节点：Sub 管最大子段，Alt 管交替段。

节点合并 $\mathcal{O}(1)$，单次树操作 $\mathcal{O}(\log n)$。

子段要求非空；单点先初始化再合并，不可用全零假节点。
```cpp
struct Sub {
    ll sum,pre,suf,best;
};
Sub leaf(ll x) { return {x,x,x,x}; }
Sub merge_sub(Sub a,Sub b) {
    return {a.sum+b.sum,
        max(a.pre,a.sum+b.pre),
        max(b.suf,b.sum+a.suf),
        max({a.best,b.best,a.suf+b.pre})};
}
struct Alt {
    int len,pre,suf,best,first,last;
};
Alt alt_leaf(int x) { return {1,1,1,1,x,x}; }
Alt merge_alt(Alt a,Alt b) {
    Alt c={a.len+b.len,a.pre,b.suf,
        max(a.best,b.best),a.first,b.last};
    if (a.last!=b.first) {
        c.best=max(c.best,a.suf+b.pre);
        if (a.pre==a.len) c.pre=a.len+b.pre;
        if (b.suf==b.len) c.suf=b.len+a.suf;
    }
    return c;
}

template<class T,T (*merge)(T,T)>
struct PointTree {
    int n; vector<T> t;
    PointTree(vector<T> a):n(a.size()),t(4*n) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (l==r) { t[o]=a[l]; return; }
            int m=(l+r)/2;
            go(o*2,l,m); go(o*2+1,m+1,r);
            t[o]=merge(t[o*2],t[o*2+1]);
        }; go(1,0,n-1);
    }
    void set(int p,T v) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (l==r) { t[o]=v; return; }
            int m=(l+r)/2;
            if (p<=m) go(o*2,l,m);
            else go(o*2+1,m+1,r);
            t[o]=merge(t[o*2],t[o*2+1]);
        }; go(1,0,n-1);
    }
    T query(int L,int R) {
        function<T(int,int,int)> go=
        [&](int o,int l,int r)->T {
            if (L<=l&&r<=R) return t[o];
            int m=(l+r)/2;
            if (R<=m) return go(o*2,l,m);
            if (L>m) return go(o*2+1,m+1,r);
            return merge(go(o*2,l,m),go(o*2+1,m+1,r));
        }; return go(1,0,n-1);
    }
};
// vector<Sub> a：将原数 x 映射为 leaf(x)。
// PointTree<Sub,merge_sub> st(a);
// 修改 st.set(p,leaf(x))；查询 st.query(l,r).best。
// 交替段：PointTree<Alt,merge_alt>，用 alt_leaf(x)。
```

### 12 01 覆盖、翻转与最长连续段

来源：P2572 / P3870。BinarySeg(a)；modify(l,r,op)，op=0/1 覆盖，op=2 翻转；query 返回统计。

节点操作 $\mathcal{O}(1)$，整棵树操作 $\mathcal{O}(\log n)$。

同时维护 0/1 两套信息；覆盖要清掉翻转，翻转要改已有覆盖值。
```cpp
struct BinaryNode {
    int len=0,sum=0;
    int pre[2]{},suf[2]{},best[2]{};
    int set=-1; bool flip=false;
};
BinaryNode binary_leaf(int x) {
    BinaryNode t; t.len=1; t.sum=x;
    t.pre[x]=t.suf[x]=t.best[x]=1; return t;
}
BinaryNode merge_binary(BinaryNode a,BinaryNode b) {
    BinaryNode c; c.len=a.len+b.len;
    c.sum=a.sum+b.sum;
    for (int x=0;x<2;x++) {
        c.pre[x]=a.pre[x]; c.suf[x]=b.suf[x];
        if (a.pre[x]==a.len) c.pre[x]+=b.pre[x];
        if (b.suf[x]==b.len) c.suf[x]+=a.suf[x];
        c.best[x]=max({a.best[x],b.best[x],
            a.suf[x]+b.pre[x]});
    }
    return c;
}
void cover(BinaryNode& t,int x) {
    t.sum=x*t.len; t.set=x; t.flip=false;
    for (int b=0;b<2;b++)
        t.pre[b]=t.suf[b]=t.best[b]=(b==x?t.len:0);
}
void reverse(BinaryNode& t) {
    t.sum=t.len-t.sum;
    swap(t.pre[0],t.pre[1]);
    swap(t.suf[0],t.suf[1]);
    swap(t.best[0],t.best[1]);
    if (t.set!=-1) t.set^=1; else t.flip^=1;
}
// push：先对子节点 cover，再 reverse，最后清父标记。

struct BinarySeg {
    int n; vector<BinaryNode> t;
    BinarySeg(vector<int> a):n(a.size()),t(4*n) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (l==r) { t[o]=binary_leaf(a[l]); return; }
            int m=(l+r)/2;
            go(o*2,l,m); go(o*2+1,m+1,r); pull(o);
        }; go(1,0,n-1);
    }
    void pull(int o) { t[o]=merge_binary(t[o*2],t[o*2+1]); }
    void push(int o) {
        for (int c:{o*2,o*2+1}) {
            if (t[o].set!=-1) cover(t[c],t[o].set);
            if (t[o].flip) reverse(t[c]);
        }
        t[o].set=-1; t[o].flip=false;
    }
    void modify(int L,int R,int op) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (L<=l&&r<=R) {
                if (op==2) reverse(t[o]);
                else cover(t[o],op);
                return;
            }
            push(o); int m=(l+r)/2;
            if (L<=m) go(o*2,l,m);
            if (R>m) go(o*2+1,m+1,r); pull(o);
        }; go(1,0,n-1);
    }
    BinaryNode query(int L,int R) {
        function<BinaryNode(int,int,int)> go=
        [&](int o,int l,int r)->BinaryNode {
            if (L<=l&&r<=R) return t[o];
            push(o); int m=(l+r)/2;
            if (R<=m) return go(o*2,l,m);
            if (L>m) return go(o*2+1,m+1,r);
            return merge_binary(go(o*2,l,m),
                go(o*2+1,m+1,r));
        }; return go(1,0,n-1);
    }
};
```

### 13 区间加的平方和与方差

来源：P1471。MomentSeg(a)；add(l,r,x)；query 返回节点，mean/variance 读取均值方差。

节点 $\mathcal{O}(1)$，树操作 $\mathcal{O}(\log n)$。

平方和必须先使用旧 sum 更新；方差仅可将微小负误差截零。
```cpp
struct Moment {
    int len; double sum,square,lazy;
};
Moment merge(Moment a,Moment b) {
    return {a.len+b.len,a.sum+b.sum,
        a.square+b.square,0};
}
void apply_moment(Moment& t,double x) {
    t.square+=2*x*t.sum+t.len*x*x;
    t.sum+=t.len*x; t.lazy+=x;
}
double mean(Moment t) { return t.sum/t.len; }
double variance(Moment t) {
    double ans=t.square/t.len-mean(t)*mean(t);
    if (ans<0&&ans>-1e-9) ans=0;
    return ans;
}
// 叶子：{1,x,x*x,0}；push 将 lazy 加给两儿子。

struct MomentSeg {
    int n; vector<Moment> t;
    MomentSeg(vector<double> a):n(a.size()),t(4*n) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (l==r) { t[o]={1,a[l],a[l]*a[l],0}; return; }
            int m=(l+r)/2; go(o*2,l,m);
            go(o*2+1,m+1,r); pull(o);
        }; go(1,0,n-1);
    }
    void pull(int o) { t[o]=merge(t[o*2],t[o*2+1]); }
    void push(int o) {
        apply_moment(t[o*2],t[o].lazy);
        apply_moment(t[o*2+1],t[o].lazy); t[o].lazy=0;
    }
    void add(int L,int R,double x) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (L<=l&&r<=R) { apply_moment(t[o],x); return; }
            push(o); int m=(l+r)/2;
            if (L<=m) go(o*2,l,m);
            if (R>m) go(o*2+1,m+1,r); pull(o);
        }; go(1,0,n-1);
    }
    Moment query(int L,int R) {
        function<Moment(int,int,int)> go=
        [&](int o,int l,int r)->Moment {
            if (L<=l&&r<=R) return t[o];
            push(o); int m=(l+r)/2;
            if (R<=m) return go(o*2,l,m);
            if (L>m) return go(o*2+1,m+1,r);
            return merge(go(o*2,l,m),go(o*2+1,m+1,r));
        }; return go(1,0,n-1);
    }
};
```

### 14 主席树：区间第 k 小

来源：P3834。PST(a)，a 为零下标；query(l,r,k) 查询原数组闭区间。

建树 $\mathcal{O}(n \log n)$，查询 $\mathcal{O}(\log n)$，空间 $\mathcal{O}(n \log n)$。

数组非空，1<=k<=区间长度；修改时复制路径，0 为共享空节点。
```cpp
struct PST {
    struct Node { int l=0,r=0,cnt=0; };
    vector<Node> t=vector<Node>(1);
    vector<int> root={0}; vector<ll> val;
    int add(int old,int l,int r,int x) {
        int o=t.size(); t.push_back(t[old]);
        t[o].cnt++;
        if (l<r) {
            int m=(l+r)/2;
            if (x<=m) t[o].l=add(t[old].l,l,m,x);
            else t[o].r=add(t[old].r,m+1,r,x);
        }
        return o;
    }
    PST(vector<ll> a):val(a) {
        sort(val.begin(),val.end());
        val.erase(unique(val.begin(),val.end()),val.end());
        for (ll x:a) {
            int p=lower_bound(val.begin(),val.end(),x)
                -val.begin();
            int rt=add(root.back(),0,val.size()-1,p);
            root.push_back(rt);
        }
    }
    ll query(int l,int r,int k) {
        int x=root[l],y=root[r+1];
        int L=0,R=val.size()-1;
        while (L<R) {
            int m=(L+R)/2;
            int c=t[t[y].l].cnt-t[t[x].l].cnt;
            if (k<=c) x=t[x].l,y=t[y].l,R=m;
            else k-=c,x=t[x].r,y=t[y].r,L=m+1;
        }
        return val[L];
    }
};
```

### 15 可持久化数组

来源：P3919。build 初始根；update(old,0,n-1,pos,v) 返回新根。

建树 $\mathcal{O}(n)$，单点修改与查询 $\mathcal{O}(\log n)$。

纯查询版本直接复用旧根；vector 扩容时不保留节点引用。
```cpp
struct PersistentArray {
    struct Node { int l=0,r=0; ll v=0; };
    vector<Node> t=vector<Node>(1);
    int build(vector<ll>& a,int l,int r) {
        int o=t.size(); t.push_back({});
        if (l==r) t[o].v=a[l];
        else {
            int m=(l+r)/2;
            t[o].l=build(a,l,m);
            t[o].r=build(a,m+1,r);
        }
        return o;
    }
    int update(int old,int l,int r,int p,ll v) {
        int o=t.size(); t.push_back(t[old]);
        if (l==r) t[o].v=v;
        else {
            int m=(l+r)/2;
            if (p<=m) t[o].l=update(t[old].l,l,m,p,v);
            else t[o].r=update(t[old].r,m+1,r,p,v);
        }
        return o;
    }
    ll query(int o,int l,int r,int p) {
        if (l==r) return t[o].v;
        int m=(l+r)/2;
        if (p<=m) return query(t[o].l,l,m,p);
        return query(t[o].r,m+1,r,p);
    }
};
```

### 16 Trie 前缀计数

来源：P8306。insert(s) 插入字符串，prefix(s) 求有此前缀的个数。

每串 $\mathcal{O}(L \log \Sigma)$，空间 $\mathcal{O}(\text{总字符数})$。

沿用 map 子节点，兼容任意字符；查询不要用 [] 新建节点。
```cpp
struct Trie {
    struct Node { map<char,int> next; int cnt=0; };
    vector<Node> t=vector<Node>(1);
    void insert(const string& s) {
        int o=0; t[o].cnt++;
        for (char c:s) {
            if (!t[o].next.count(c)) {
                int id=t.size(); t.push_back({});
                t[o].next[c]=id;
            }
            o=t[o].next[c]; t[o].cnt++;
        }
    }
    int prefix(const string& s) const {
        int o=0;
        for (char c:s) {
            auto it=t[o].next.find(c);
            if (it==t[o].next.end()) return 0;
            o=it->second;
        }
        return t[o].cnt;
    }
};
```

### 17 multiset 滑动窗口最值

来源：P1886 / P2032 / P2251 / P2216。返回每个长度 k 窗口的 {最小值,最大值}。

时间 $\mathcal{O}(n \log k)$，空间 $\mathcal{O}(k)$。

erase(iterator) 只删一份；erase(value) 会删光重复值。
```cpp
vector<pair<ll,ll>> windows(vector<ll> a,int k) {
    multiset<ll> s; vector<pair<ll,ll>> ans;
    for (int i=0;i<(int)a.size();i++) {
        s.insert(a[i]);
        if (i>=k) s.erase(s.find(a[i-k]));
        if (i>=k-1)
            ans.push_back({*s.begin(),*s.rbegin()});
    }
    return ans;
}
// 最小值容器同样可作 P3378 的插入/查询/删除板。
// 二维窗口：先按行求一维最值，再按列求最值。
```

### 24 离线区间不同数

来源：P1972 / P1638。输入零下标数组和闭区间查询，按原查询顺序返回不同数个数。

时间 $\mathcal{O}((n+q) \log n)$，空间 $\mathcal{O}(n+q)$。

每个值只保留最近出现位置的 +1，旧位置记 -1。
```cpp
vector<int> distinct_count(vector<ll> a,
    vector<pair<int,int>> queries) {
    int n=a.size(),q=queries.size();
    vector<int> id(q),bit(n+1),ans(q);
    iota(id.begin(),id.end(),0);
    sort(id.begin(),id.end(),[&](int x,int y) {
        return queries[x].second<queries[y].second;
    });
    auto add=[&](int x,int v) {
        for (++x;x<=n;x+=x&-x) bit[x]+=v;
    };
    auto sum=[&](int x) {
        int s=0;
        for (++x;x>0;x-=x&-x) s+=bit[x];
        return s;
    };
    map<ll,int> last; int r=0;
    for (int i:id) {
        auto [L,R]=queries[i];
        while (r<=R) {
            auto it=last.find(a[r]);
            if (it!=last.end()) add(it->second,-1);
            add(r,1); last[a[r]]=r; r++;
        }
        ans[i]=sum(R)-sum(L-1);
    }
    return ans;
}
```

### 26 单调栈：直方图面积与矩形计数

来源：P4147 / P1950 / P2866。histogram 求最大矩形面积；count_rect 求连续段最小值之和。

每行 $\mathcal{O}(m)$，整个网格 $\mathcal{O}(nm)$。

网格先累计每列连续可用高度；面积或计数均用 ll。
```cpp
ll histogram(vector<ll> h) {
    h.push_back(0); vector<int> st; ll ans=0;
    for (int i=0;i<(int)h.size();i++) {
        while (!st.empty()&&h[st.back()]>=h[i]) {
            int p=st.back(); st.pop_back();
            int l=st.empty()?-1:st.back();
            ans=max(ans,h[p]*(i-l-1));
        }
        st.push_back(i);
    }
    return ans;
}
ll count_rect(vector<ll> h) {
    vector<pair<ll,ll>> st;
    ll ending=0,ans=0;
    for (ll x:h) {
        ll cnt=1;
        while (!st.empty()&&st.back().first>=x) {
            auto [v,c]=st.back(); st.pop_back();
            ending-=v*c; cnt+=c;
        }
        st.push_back({x,cnt}); ending+=x*cnt;
        ans+=ending;
    }
    return ans;
}
// 网格：每处理一行，按可用格更新高度数组 h。
// 面积取 max(histogram(h))；总数累加 count_rect(h)。
```

### 27 回滚莫队的删除框架

来源：P8078。初始维护完整区间，查询左端点分块、右端点递减。

单次删/撤 $\mathcal{O}(1)$ 时，约 $\mathcal{O}(n^2/B+qB)$。

本板给执行框架；del/undo/current 由具体统计量实现。
```cpp
struct Query { int l,r,id; };
template<class Delete,class Undo,class Current>
vector<ll> rollback_mo(int n,vector<Query> qs,
    Delete del,Undo undo,Current current) {
    int q=qs.size();
    int B=max(1,(int)(n/sqrt(max(1,q))));
    sort(qs.begin(),qs.end(),[&](Query a,Query b) {
        int x=a.l/B,y=b.l/B;
        if (x!=y) return x<y;
        return a.r>b.r;
    });
    vector<ll> ans(q);
    int left=0,right=n-1,base=0;
    bool first=true;
    for (auto [l,r,id]:qs) {
        int start=l/B*B;
        if (first||start!=base) {
            while (right<n-1) undo(),right++;
            while (left<start) del(left++,false);
            base=start; first=false;
        }
        while (right>r) del(right--,true);
        while (left<l) del(left++,true);
        ans[id]=current();
        while (left>base) undo(),left--;
    }
    return ans;
}
// del(i,save): save=true 则记录恢复信息。
// 双链表删点：nxt[pre[i]]=nxt[i]，反向同理。
// undo 用原 pre[i],nxt[i] 接回，恢复旧答案。
```

### 56 开方线段树与稳定区间剪枝

来源：P4145。SqrtSeg(a)；root(l,r) 区间向下取整开方；query 求区间和。

查询 $\mathcal{O}(\log n)$，更新按仍会改变的叶子数量计算。

仅用于非负整数。mx<=1 的整段已稳定；平方根用整数修正。
```cpp
struct SqrtSeg {
    int n; vector<ll> sum,mx;
    SqrtSeg(vector<ll> a):n(a.size()),sum(4*n),mx(4*n) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (l==r) { sum[o]=mx[o]=a[l]; return; }
            int m=(l+r)/2; go(o*2,l,m);
            go(o*2+1,m+1,r); pull(o);
        }; go(1,0,n-1);
    }
    void pull(int o) {
        sum[o]=sum[o*2]+sum[o*2+1];
        mx[o]=max(mx[o*2],mx[o*2+1]);
    }
    void root(int L,int R) {
        function<void(int,int,int)> go=
        [&](int o,int l,int r) {
            if (mx[o]<=1) return;
            if (l==r) {
                ll x=sqrtl(sum[o]);
                while (x+1<=sum[o]/(x+1)) x++;
                while (x&&x>sum[o]/x) x--;
                sum[o]=mx[o]=x; return;
            }
            int m=(l+r)/2;
            if (L<=m) go(o*2,l,m);
            if (R>m) go(o*2+1,m+1,r); pull(o);
        }; go(1,0,n-1);
    }
    ll query(int L,int R) {
        function<ll(int,int,int)> go=
        [&](int o,int l,int r)->ll {
            if (L<=l&&r<=R) return sum[o];
            int m=(l+r)/2; ll ans=0;
            if (L<=m) ans+=go(o*2,l,m);
            if (R>m) ans+=go(o*2+1,m+1,r);
            return ans;
        }; return go(1,0,n-1);
    }
};
```

### 58 对顶堆动态分位数

来源：P7072。insert(x,k) 插入后维持最大的 k 个元素；threshold 返回其中最小值。

调整 $\mathcal{O}((1+|k\text{ 的改变量}|)\log n)$，空间 $\mathcal{O}(n)$。

1<=k<=当前元素数；k 变化越大，调整开销越大。
```cpp
struct TopK {
    priority_queue<ll,vector<ll>,greater<ll>> hi;
    priority_queue<ll> lo;
    void insert(ll x,int k) {
        lo.push(x);
        while ((int)hi.size()<k) {
            hi.push(lo.top()); lo.pop();
        }
        while ((int)hi.size()>k) {
            lo.push(hi.top()); hi.pop();
        }
        while (!lo.empty()&&!hi.empty()&&
            lo.top()>hi.top()) {
            ll x=lo.top(),y=hi.top();
            lo.pop(); hi.pop(); lo.push(y); hi.push(x);
        }
    }
    ll threshold() const { return hi.top(); }
};
```

## 🕸️ 图论与树

### 18 并查集与 Kruskal

来源：P3366 / P14362。kruskal(n,edges) 返回 MST 总权，无生成树返回 -1。

排序 $\mathcal{O}(m \log m)$，并查集均摊近似 $\mathcal{O}(1)$。

点从 1 开始；若允许负权，改用可选值标识不连通。
```cpp
struct DSU {
    vector<int> p,sz;
    DSU(int n):p(n+1),sz(n+1,1) {
        iota(p.begin(),p.end(),0);
    }
    int find(int x) {
        return p[x]==x?x:p[x]=find(p[x]);
    }
    bool unite(int x,int y) {
        x=find(x); y=find(y);
        if (x==y) return false;
        if (sz[x]<sz[y]) swap(x,y);
        p[y]=x; sz[x]+=sz[y]; return true;
    }
};
struct Edge { int u,v; ll w; };
ll kruskal(int n,vector<Edge> e) {
    sort(e.begin(),e.end(),[](Edge a,Edge b) {
        return a.w<b.w;
    });
    DSU d(n); ll ans=0; int cnt=0;
    for (auto [u,v,w]:e) if (d.unite(u,v)) {
        ans+=w; cnt++;
    }
    return cnt==n-1?ans:-1;
}
```

### 19 倍增 LCA 与树上点差分

来源：P3379 / P3128。LCA(g,root)，点从 1 开始；add_path 后 accumulate 返回经过各点次数。

预处理 $\mathcal{O}(n \log n)$，LCA $\mathcal{O}(\log n)$，汇总 $\mathcal{O}(n)$。

g 必须是树。点差分减 LCA 和其父；边差分则在 LCA 减二。
```cpp
struct LCA {
    int n,LOG=1;
    vector<int> dep,order;
    vector<vector<int>> up;
    vector<ll> diff;
    LCA(const vector<vector<int>>& g,int root=1)
        :n(g.size()-1),dep(n+1,-1),diff(n+1) {
        while ((1LL<<LOG)<=n) LOG++;
        up.assign(LOG,vector<int>(n+1));
        dep[root]=0; order.push_back(root);
        for (int i=0;i<(int)order.size();i++) {
            int x=order[i];
            for (int y:g[x]) if (dep[y]==-1) {
                dep[y]=dep[x]+1; up[0][y]=x;
                order.push_back(y);
            }
        }
        for (int b=1;b<LOG;b++)
            for (int x=1;x<=n;x++)
                up[b][x]=up[b-1][up[b-1][x]];
    }
    int lca(int x,int y) const {
        if (dep[x]<dep[y]) swap(x,y);
        int d=dep[x]-dep[y];
        for (int b=0;b<LOG;b++)
            if (d>>b&1) x=up[b][x];
        if (x==y) return x;
        for (int b=LOG-1;b>=0;b--)
            if (up[b][x]!=up[b][y])
                x=up[b][x],y=up[b][y];
        return up[0][x];
    }
    void add_path(int x,int y,ll v=1) {
        int z=lca(x,y);
        diff[x]+=v; diff[y]+=v;
        diff[z]-=v; diff[up[0][z]]-=v;
    }
    vector<ll> accumulate() const {
        auto ans=diff;
        for (int i=(int)order.size()-1;i>0;i--) {
            int x=order[i]; ans[up[0][x]]+=ans[x];
        }
        return ans;
    }
};
```

### 20 Tarjan 强连通分量与缩点

来源：B3609 / P3387。SCC(g) 得到 col；将不同分量的原边连到新图，累加分量点权。

时间与空间 $\mathcal{O}(n+m)$。

点为 0..n-1。回边只处理仍在栈内者；深链留意递归栈。
```cpp
struct SCC {
    int timer=0,cnt=0;
    vector<int> dfn,low,col,stk;
    vector<bool> in;
    SCC(const vector<vector<int>>& g) {
        int n=g.size(); dfn.resize(n); low.resize(n);
        col.resize(n); in.resize(n);
        function<void(int)> dfs=[&](int x) {
            dfn[x]=low[x]=++timer;
            stk.push_back(x); in[x]=true;
            for (int y:g[x]) {
                if (!dfn[y]) {
                    dfs(y); low[x]=min(low[x],low[y]);
                } else if (in[y])
                    low[x]=min(low[x],dfn[y]);
            }
            if (dfn[x]==low[x]) {
                while (true) {
                    int y=stk.back(); stk.pop_back();
                    in[y]=false; col[y]=cnt;
                    if (y==x) break;
                }
                cnt++;
            }
        };
        for (int i=0;i<n;i++) if (!dfn[i]) dfs(i);
    }
    vector<vector<int>> shrink(
        const vector<vector<int>>& g) const {
        vector<vector<int>> h(cnt);
        for (int x=0;x<(int)g.size();x++)
            for (int y:g[x]) if (col[x]!=col[y])
                h[col[x]].push_back(col[y]);
        for (auto& v:h) {
            sort(v.begin(),v.end());
            v.erase(unique(v.begin(),v.end()),v.end());
        }
        return h;
    }
};
```

### 21 二分图最大匹配：增广路

来源：P3386。g[x] 为左部 x 相邻的右部点；返回最大匹配数。

时间 $\mathcal{O}(\text{左部点数} \cdot \text{边数})$，空间 $\mathcal{O}(n+m)$。

左右点均从 0 开始；每轮重新设置右部访问标记。
```cpp
int matching(vector<vector<int>> g,int right_n) {
    vector<int> match(right_n,-1),seen(right_n);
    function<bool(int,int)> dfs=[&](int x,int tag) {
        for (int y:g[x]) {
            if (seen[y]==tag) continue;
            seen[y]=tag;
            if (match[y]==-1||dfs(match[y],tag)) {
                match[y]=x; return true;
            }
        }
        return false;
    };
    int ans=0;
    for (int x=0;x<(int)g.size();x++)
        if (dfs(x,x+1)) ans++;
    return ans;
}
```

### 22 树的重心与树的直径

来源：P1395 / P1099。centroid 返回最大剩余块最小的点；diameter 求非负边权树直径。

两者时间 $\mathcal{O}(n)$，空间 $\mathcal{O}(n)$。

重心方法不是换根 DP；直径两次最远点法要求边权非负。
```cpp
int centroid(const vector<vector<int>>& g) {
    int n=g.size(),ans=-1,best=n+1;
    vector<int> sz(n);
    function<void(int,int)> dfs=[&](int x,int p) {
        sz[x]=1; int mx=0;
        for (int y:g[x]) if (y!=p) {
            dfs(y,x); sz[x]+=sz[y];
            mx=max(mx,sz[y]);
        }
        mx=max(mx,n-sz[x]);
        if (mx<best||(mx==best&&x<ans))
            best=mx,ans=x;
    }; dfs(0,-1); return ans;
}
ll diameter(vector<vector<pair<int,ll>>> g) {
    auto farthest=[&](int root) {
        vector<ll> d(g.size(),-1);
        vector<int> st={root}; d[root]=0;
        for (int i=0;i<(int)st.size();i++) {
            int x=st[i];
            for (auto [y,w]:g[x]) if (d[y]==-1)
                d[y]=d[x]+w,st.push_back(y);
        }
        int x=max_element(d.begin(),d.end())-d.begin();
        return pair<int,ll>{x,d[x]};
    };
    return farthest(farthest(0).first).second;
}
```

### 23 函数跳转倍增

来源：P3509 / P4155。nxt[x] 给下一跳，jump(x,k) 求跳 k 次后的点。

预处理 $\mathcal{O}(63n)$，查询 $\mathcal{O}(63)$，空间 $\mathcal{O}(63n)$。

点从 0 开始；无后继时可令它跳自己。
```cpp
struct Jump {
    vector<vector<int>> up;
    Jump(vector<int> nxt):up(63,nxt) {
        for (int b=1;b<63;b++)
            for (int x=0;x<(int)nxt.size();x++)
                up[b][x]=up[b-1][up[b-1][x]];
    }
    int jump(int x,ll k) const {
        for (int b=0;b<63;b++)
            if (k>>b&1) x=up[b][x];
        return x;
    }
};
// 环形覆盖：复制区间，双指针求最远下一跳。
// 最少跳数：由高到低试跳且不得越过目标。
```

## 🔍 搜索、分治、贪心与计算几何

### 25 三维偏序 CDQ

来源：P3810。返回直方图：ans[k] 表示恰有 k 个其他点三维均不大于它。

时间 $\mathcal{O}(n \log^2 n)$，空间 $\mathcal{O}(n)$。

先合并完全重复点；第三维离散化；归并后撤销 BIT 贡献。
```cpp
struct Point3 { int a,b,c,w=1; ll got=0; };
vector<ll> dominance(vector<array<int,3>> input) {
    int n=input.size(); vector<int> zs;
    sort(input.begin(),input.end());
    vector<Point3> a;
    for (auto p:input) {
        if (!a.empty()&&a.back().a==p[0]&&
            a.back().b==p[1]&&a.back().c==p[2])
            a.back().w++;
        else a.push_back({p[0],p[1],p[2]});
        zs.push_back(p[2]);
    }
    sort(zs.begin(),zs.end());
    zs.erase(unique(zs.begin(),zs.end()),zs.end());
    for (auto& p:a)
        p.c=lower_bound(zs.begin(),zs.end(),p.c)
            -zs.begin()+1;
    vector<ll> bit(zs.size()+1);
    auto add=[&](int x,int v) {
        for (;x<(int)bit.size();x+=x&-x) bit[x]+=v;
    };
    auto sum=[&](int x) {
        ll s=0; for (;x;x-=x&-x) s+=bit[x];
        return s;
    };
    function<void(int,int)> cdq=[&](int l,int r) {
        if (l>=r) return;
        int m=(l+r)/2; cdq(l,m); cdq(m+1,r);
        int i=l;
        for (int j=m+1;j<=r;j++) {
            while (i<=m&&a[i].b<=a[j].b)
                add(a[i].c,a[i].w),i++;
            a[j].got+=sum(a[j].c);
        }
        for (int j=l;j<i;j++) add(a[j].c,-a[j].w);
        inplace_merge(a.begin()+l,a.begin()+m+1,
            a.begin()+r+1,[](Point3 x,Point3 y) {
                return x.b<y.b;
            });
    };
    cdq(0,(int)a.size()-1);
    vector<ll> ans(n);
    for (auto p:a) ans[p.got+p.w-1]+=p.w;
    return ans;
}
```

### 28 k 叉 Huffman 与截止时间反悔贪心

来源：P1090 / P2168 / P4053。huffman 求合并总成本及最大深度；schedule 求最多可完成任务数。

时间 $\mathcal{O}(n \log n)$，空间 $\mathcal{O}(n)$。

Huffman 权非负、至少一项、k>=2；任务为 {耗时,截止时刻}。
```cpp
pair<ll,int> huffman(vector<ll> w,int k=2) {
    using P=pair<ll,int>;
    priority_queue<P,vector<P>,greater<P>> q;
    for (ll x:w) q.push({x,0});
    int pad=(k-1-(w.size()-1)%(k-1))%(k-1);
    while (pad--) q.push({0,0});
    ll ans=0;
    while (q.size()>1) {
        ll sum=0; int dep=0;
        for (int i=0;i<k;i++) {
            auto [x,d]=q.top(); q.pop();
            sum+=x; dep=max(dep,d+1);
        }
        ans+=sum; q.push({sum,dep});
    }
    return {ans,q.top().second};
}
int schedule(vector<pair<ll,ll>> task) {
    sort(task.begin(),task.end(),[](auto a,auto b) {
        return a.second<b.second;
    });
    priority_queue<ll> q; ll used=0;
    for (auto [cost,deadline]:task) {
        used+=cost; q.push(cost);
        if (used>deadline) used-=q.top(),q.pop();
    }
    return q.size();
}
```

### 29 多路归并与整体增量

来源：P1631 / P2723 / P2827。pair_sums 输出两个升序序列的前 k 小二元和。

时间 $\mathcal{O}((n+k) \log n)$，空间 $\mathcal{O}(n)$。

允许相同数值的不同下标组合重复出现；k 不超过总组合数。
```cpp
vector<ll> pair_sums(vector<ll> a,vector<ll> b,int k) {
    using T=tuple<ll,int,int>;
    priority_queue<T,vector<T>,greater<T>> q;
    for (int i=0;i<(int)a.size();i++)
        if (!b.empty()) q.push({a[i]+b[0],i,0});
    vector<ll> ans;
    while (k--&&!q.empty()) {
        auto [v,i,j]=q.top(); q.pop();
        ans.push_back(v);
        if (j+1<(int)b.size())
            q.push({a[i]+b[j+1],i,j+1});
    }
    return ans;
}
// 丑数：每个质因子对应一路 ans[pos]*prime，弹出后
// 推进该路指针；与上一答案相等则跳过重复答案。
// 全体每步增 q：记录 offset；入队存 x-offset，
// 出队还原 stored+offset；单调产生的新值可用队列。
```

### 30 Andrew 凸包与周长

来源：P2742 / P17282。hull 返回逆时针凸包；perimeter 计算其周长。

时间 $\mathcal{O}(n \log n)$，空间 $\mathcal{O}(n)$。

以下删除边上的中间共线点；整数坐标可将 cross 改 ll。
```cpp
struct Point {
    double x,y;
    bool operator<(const Point& b) const {
        return x!=b.x?x<b.x:y<b.y;
    }
    bool operator==(const Point& b) const {
        return x==b.x&&y==b.y;
    }
};
double cross(Point a,Point b,Point c) {
    return (b.x-a.x)*(c.y-a.y)
        -(b.y-a.y)*(c.x-a.x);
}
vector<Point> hull(vector<Point> a) {
    sort(a.begin(),a.end());
    a.erase(unique(a.begin(),a.end()),a.end());
    if (a.size()<=1) return a;
    vector<Point> h;
    for (Point p:a) {
        while (h.size()>=2&&
            cross(h[h.size()-2],h.back(),p)<=0)
            h.pop_back();
        h.push_back(p);
    }
    int k=h.size();
    for (int i=(int)a.size()-2;i>=0;i--) {
        while ((int)h.size()>k&&
            cross(h[h.size()-2],h.back(),a[i])<=0)
            h.pop_back();
        h.push_back(a[i]);
    }
    h.pop_back(); return h;
}
double perimeter(vector<Point> h) {
    double ans=0; int n=h.size();
    for (int i=0;i<n;i++) {
        Point a=h[i],b=h[(i+1)%n];
        ans+=hypot(a.x-b.x,a.y-b.y);
    }
    return ans;
}
```

### 57 BFS 最短步数与 DFS 路径回溯

来源：B3626 / P1162 / P1238。bfs 返回各点最少边数；all_paths 对每条简单路径调用 visit。

BFS $\mathcal{O}(n+m)$；路径枚举可能指数级。

BFS 入队时标记；回溯 DFS 返回时撤销标记。
```cpp
vector<int> bfs(vector<vector<int>> g,int start) {
    vector<int> d(g.size(),-1); queue<int> q;
    d[start]=0; q.push(start);
    while (!q.empty()) {
        int x=q.front(); q.pop();
        for (int y:g[x]) if (d[y]==-1) {
            d[y]=d[x]+1; q.push(y);
        }
    }
    return d;
}
template<class Visit>
void all_paths(vector<vector<int>> g,int s,int goal,
    Visit visit) {
    vector<bool> used(g.size()); vector<int> path;
    function<void(int)> dfs=[&](int x) {
        path.push_back(x); used[x]=true;
        if (x==goal) visit(path);
        else for (int y:g[x]) if (!used[y]) dfs(y);
        used[x]=false; path.pop_back();
    }; dfs(s);
}
// 网格将合法的四邻居作为隐式边；洪水填充从外边界开始。
// 状态搜索：将棋盘编码成整数/字符串，再用哈希集判重。
```

### 59 最小圆覆盖、二分半径与贪心分段

来源：P3517。Solver(n,m)，写入 p；minimumEnclosingCircle(l,r) 处理半开区间。

随机增量圆覆盖期望线性；外层判定成本依分段试探次数。

feasible(R) 判能否分成至多 m 段；本段保留原 AC 的几何核心。
```cpp
using namespace std;
using Real = double;

struct Point {
    Real x, y;
    Point(Real x_ = 0, Real y_ = 0) : x(x_), y(y_) {}
};

struct Circle {
    Point o;
    Real r2;
    Circle(const Point& o_ = Point(), Real r2_ = -1)
        : o(o_), r2(r2_) {}
};

static Real dist2(const Point& a, const Point& b) {
    Real dx = a.x - b.x;
    Real dy = a.y - b.y;
    return dx * dx + dy * dy;
}

static bool contains(const Circle& c, const Point& p) {
    if (c.r2 < 0) return false;
    Real eps = 8e-15 * max<Real>(1, c.r2);
    return dist2(c.o, p) <= c.r2 + eps;
}

static Circle pointCircle(const Point& a) {
    return Circle(a, 0);
}

static Circle diameterCircle(const Point& a, const Point& b) {
    Point o((a.x + b.x) / 2, (a.y + b.y) / 2);
    return Circle(o, dist2(o, a));
}

static Circle circumcircle(
    const Point& a,
    const Point& b,
    const Point& c
) {
    Real d = 2 * (
        a.x * (b.y - c.y) +
        b.x * (c.y - a.y) +
        c.x * (a.y - b.y)
    );

    Real aa = a.x * a.x + a.y * a.y;
    Real bb = b.x * b.x + b.y * b.y;
    Real cc = c.x * c.x + c.y * c.y;

    Point o(
        (aa * (b.y - c.y) +
         bb * (c.y - a.y) +
         cc * (a.y - b.y)) / d,

        (aa * (c.x - b.x) +
         bb * (a.x - c.x) +
         cc * (b.x - a.x)) / d
    );

    return Circle(o, dist2(o, a));
}

static Real cross(const Point& a, const Point& b) {
    return a.x * b.y - a.y * b.x;
}

static Point operator-(const Point& a, const Point& b) {
    return Point(a.x - b.x, a.y - b.y);
}

class Solver {
public:
    int n, m;
    vector<Point> p;

    Solver(int n_, int m_) : n(n_), m(m_), p(n_) {}

    Circle minimumEnclosingCircle(int left, int right) {
        work.assign(p.begin() + left, p.begin() + right);
        fastShuffle();

        Circle circle;

        for (int i = 0; i < (int)work.size(); ++i) {
            if (contains(circle, work[i])) continue;

            circle = pointCircle(work[i]);

            for (int j = 0; j <= i; ++j) {
                if (contains(circle, work[j])) continue;

                if (circle.r2 == 0) {
                    circle = diameterCircle(work[i], work[j]);
                } else {
                    circle = circleWithTwoBoundaryPoints(
                        work[i], work[j], j + 1
                    );
                }
            }
        }

        return circle;
    }

    bool segmentFits(int left, int right, Real radius) {
        Circle circle = minimumEnclosingCircle(left, right);

        Real radius2 = radius * radius;
        Real eps = 1e-14 * max<Real>(1, radius2);

        return circle.r2 <= radius2 + eps;
    }

    int longestSegment(int left, Real radius) {
        int good = left + 1;
        int length = 1;
        int bad = n + 1;

        while (good < n) {
            int candidate = min(n, left + 2 * length);

            if (segmentFits(left, candidate, radius)) {
                good = candidate;
                length *= 2;

                if (good == n) return n;
            } else {
                bad = candidate;
                break;
            }
        }

        while (bad - good > 1) {
            int middle = good + (bad - good) / 2;

            if (segmentFits(left, middle, radius)) {
                good = middle;
            } else {
                bad = middle;
            }
        }

        return good;
    }

    bool feasible(Real radius) {
        int position = 0;

        for (int used = 0; used < m && position < n; ++used) {
            position = longestSegment(position, radius);
        }

        return position == n;
    }

    vector<Circle> buildAnswer(Real radius) {
        vector<Circle> result;
        int position = 0;

        while (position < n) {
            int end = longestSegment(position, radius);

            result.push_back(
                minimumEnclosingCircle(position, end)
            );

            position = end;
        }

        return result;
    }

private:
    vector<Point> work;
    uint64_t randomState = 712367821ULL;

    Circle circleWithTwoBoundaryPoints(
        const Point& a,
        const Point& b,
        int prefixSize
    ) {
        Circle diameter = diameterCircle(a, b);
        Circle left;
        Circle right;

        Point ab = b - a;

        for (int i = 0; i < prefixSize; ++i) {
            const Point& p = work[i];

            if (contains(diameter, p)) continue;

            Real side = cross(ab, p - a);
            if (abs(side) < 1e-20) continue;

            Circle candidate = circumcircle(a, b, p);
            Real centerSide = cross(ab, candidate.o - a);

            if (side > 0) {
                if (
                    left.r2 < 0 ||
                    centerSide > cross(ab, left.o - a)
                ) {
                    left = candidate;
                }
            } else {
                if (
                    right.r2 < 0 ||
                    centerSide < cross(ab, right.o - a)
                ) {
                    right = candidate;
                }
            }
        }

        if (left.r2 < 0 && right.r2 < 0) return diameter;
        if (left.r2 < 0) return right;
        if (right.r2 < 0) return left;

        return left.r2 <= right.r2 ? left : right;
    }

    void fastShuffle() {
        for (int i = (int)work.size() - 1; i > 0; --i) {
            randomState ^= randomState << 7;
            randomState ^= randomState >> 9;

            swap(
                work[i],
                work[(size_t)(randomState % (uint64_t)(i + 1))]
            );
        }
    }
};
```

## 🧮 动态规划

### 31 最大子段和与数字三角形

来源：P1115 / P1216。两个独立函数分别求非空连续段最大和、三角形顶部到底部最大和。

子段 $\mathcal{O}(n)$/$\mathcal{O}(1)$；三角形 $\mathcal{O}(n^2)$/$\mathcal{O}(n)$。

全负数不能以 0 初始化全局答案；不可达边界使用 -INF。
```cpp
ll max_subarray(vector<ll> a) {
    ll cur=-INF,ans=-INF;
    for (ll x:a) {
        cur=max(x,cur+x); ans=max(ans,cur);
    }
    return ans;
}
ll triangle(vector<vector<ll>> a) {
    vector<ll> dp(a.size()+1,-INF); dp[0]=0;
    for (int i=0;i<(int)a.size();i++) {
        vector<ll> ndp(dp.size(),-INF);
        for (int j=0;j<=i;j++) {
            ndp[j]=max(ndp[j],dp[j]+a[i][j]);
            if (j) ndp[j]=max(ndp[j],dp[j-1]+a[i][j]);
        }
        dp.swap(ndp);
    }
    return *max_element(dp.begin(),dp.end());
}
```

### 32 树状数组优化 LIS、双向 LIS 与排列 LCS

来源：P1020 / P1091 / P1439。lis_end 返回严格上升子序列在各位置结尾的最大长度。

时间 $\mathcal{O}(n \log n)$，空间 $\mathcal{O}(n)$。

严格上升查 rank-1，非降查 rank；排列 LCS 先映射成第二串位置。
```cpp
vector<int> lis_end(vector<ll> a) {
    auto val=a; sort(val.begin(),val.end());
    val.erase(unique(val.begin(),val.end()),val.end());
    vector<int> bit(val.size()+1),dp(a.size());
    for (int i=0;i<(int)a.size();i++) {
        int p=lower_bound(val.begin(),val.end(),a[i])
            -val.begin()+1;
        int best=0;
        for (int j=p-1;j;j-=j&-j)
            best=max(best,bit[j]);
        dp[i]=best+1;
        for (int j=p;j<(int)bit.size();j+=j&-j)
            bit[j]=max(bit[j],dp[i]);
    }
    return dp;
}
// 合唱队形：L=lis_end(a)，反转 a 后再求并反转得 R，
// 最长山峰序列 max(L[i]+R[i]-1)。
// 排列 LCS：pos[b[i]]=i，求 pos[a[i]] 的 LIS。
// 最长不升：将原值取负，查询 rank（允许相等）。
```

### 33 01 背包与增量收益

来源：P1048 / P1049 / P1802。dp[j] 为恰好用 j 容量的最大收益；答案可在 0..W 中取最大。

时间 $\mathcal{O}(nW)$，空间 $\mathcal{O}(W)$。

容量必须倒序；恰好装满返回 dp[W]。不可达状态不参与加法。
```cpp
vector<ll> knapsack01(int W,vector<int> w,
    vector<ll> v) {
    vector<ll> dp(W+1,-INF); dp[0]=0;
    for (int i=0;i<(int)w.size();i++)
        for (int j=W;j>=w[i];j--)
            if (dp[j-w[i]]!=-INF)
                dp[j]=max(dp[j],dp[j-w[i]]+v[i]);
    return dp;
}
// 布尔装箱：dp[0]=true，dp[j] |= dp[j-w]。
// 5 倍经验：所有失败收益为基础，win-lose 为物品价值；
// 最终 (基础收益+最优增量)*5。
```

### 34 完全背包：最少个数、组合数、排列数

来源：P2842 / P2834 / P2840。同一面额可以重复使用；三个函数按目标返回不同统计量。

时间 $\mathcal{O}(nW)$，空间 $\mathcal{O}(W)$。

面额必须大于 0；组合数与有序方案数的循环顺序不同。
```cpp
ll min_coins(int W,vector<int> w) {
    vector<ll> dp(W+1,INF); dp[0]=0;
    for (int x:w)
        for (int j=x;j<=W;j++)
            dp[j]=min(dp[j],dp[j-x]+1);
    return dp[W]==INF?-1:dp[W];
}
ll coin_combinations(int W,vector<int> w,ll mod) {
    vector<ll> dp(W+1); dp[0]=1;
    for (int x:w)
        for (int j=x;j<=W;j++)
            dp[j]=(dp[j]+dp[j-x])%mod;
    return dp[W];
}
ll coin_orders(int W,vector<int> w,ll mod) {
    vector<ll> dp(W+1); dp[0]=1;
    for (int j=1;j<=W;j++)
        for (int x:w) if (j>=x)
            dp[j]=(dp[j]+dp[j-x])%mod;
    return dp[W];
}
```

### 35 混合背包与依赖分组背包

来源：P1833 / P1064。混合背包 cnt=0 表示无限；分组背包每组最多选一个有效组合。

朴素多重 $\mathcal{O}(W \cdot \text{总份数})$，分组 $\mathcal{O}(W \cdot \text{总组合数})$。

主件和附件先合成有效组内选项，不能单独选附件。
```cpp
ll mixed(int W,vector<int> w,vector<ll> v,
    vector<int> cnt) {
    vector<ll> dp(W+1);
    for (int i=0;i<(int)w.size();i++) {
        if (!cnt[i]) {
            for (int j=w[i];j<=W;j++)
                dp[j]=max(dp[j],dp[j-w[i]]+v[i]);
        } else for (int k=0;k<cnt[i];k++) {
            for (int j=W;j>=w[i];j--)
                dp[j]=max(dp[j],dp[j-w[i]]+v[i]);
        }
    }
    return dp[W];
}
ll grouped(int W,
    vector<vector<pair<int,ll>>> groups) {
    vector<ll> dp(W+1);
    for (auto g:groups) {
        auto old=dp;
        for (int j=0;j<=W;j++)
            for (auto [w,v]:g) if (j>=w)
                dp[j]=max(dp[j],old[j-w]+v);
    }
    return dp[W];
}
// 主件+最多两附件：主件、主+附1、主+附2、全选。
```

### 36 负权 01 背包

来源：P2340。每件含可正可负的 x、y，要求两维总和均非负，最大化总和。

令 S=sum(abs(x))，时间 $\mathcal{O}(nS)$，空间 $\mathcal{O}(S)$。

下标偏移 S；必须用旧数组转移，不能因权值正负混用滚动顺序。
```cpp
ll signed_knapsack(vector<pair<int,ll>> item) {
    int S=0;
    for (auto [x,y]:item) S+=abs(x);
    vector<ll> dp(2*S+1,-INF); dp[S]=0;
    for (auto [x,y]:item) {
        auto ndp=dp;
        for (int s=-S;s<=S;s++) {
            int ns=s+x;
            if (ns<-S||ns>S||dp[s+S]==-INF) continue;
            ndp[ns+S]=max(ndp[ns+S],dp[s+S]+y);
        }
        dp.swap(ndp);
    }
    ll ans=0;
    for (int s=0;s<=S;s++) if (dp[s+S]>=0)
        ans=max(ans,s+dp[s+S]);
    return ans;
}
```

### 37 同步双路径取数

来源：P1004。从左上到右下，两条只向右或下的路径，重合格仅计一次。

n*n 网格，时间 $\mathcal{O}(n^3)$，空间 $\mathcal{O}(n^2)$。

按同一步 t=i+j 分层，只保存两人的行；不可达状态为 -INF。
```cpp
ll two_paths(vector<vector<ll>> a) {
    int n=a.size();
    vector<vector<ll>> dp(n,vector<ll>(n,-INF));
    dp[0][0]=a[0][0];
    for (int t=1;t<=2*n-2;t++) {
        auto ndp=vector(n,vector<ll>(n,-INF));
        for (int x=max(0,t-n+1);x<=min(n-1,t);x++)
        for (int y=max(0,t-n+1);y<=min(n-1,t);y++) {
            ll best=-INF;
            for (int dx:{0,1}) for (int dy:{0,1})
                if (x>=dx&&y>=dy)
                    best=max(best,dp[x-dx][y-dy]);
            if (best==-INF) continue;
            ndp[x][y]=best+a[x][t-x];
            if (x!=y) ndp[x][y]+=a[y][t-y];
        }
        dp.swap(ndp);
    }
    return dp[n-1][n-1];
}
// 单路径计数 P1002：禁区 dp=0，其余上方+左方。
// 马本身与八个控制点先统一标记；dp[0][0]=1。
```

### 38 四种卡牌计数状态

来源：P1541。score 为零下标棋盘分数，cnt[1..4] 为各步长卡牌数。

时间、空间 $\mathcal{O}(\text{四种数量加一的乘积})$。

当前位置由已用卡牌数唯一确定，不必再存位置维。
```cpp
ll turtle(vector<ll> score,array<int,5> cnt) {
    int B=cnt[2]+1,C=cnt[3]+1,D=cnt[4]+1;
    auto id=[&](int a,int b,int c,int d) {
        return ((a*B+b)*C+c)*D+d;
    };
    vector<ll> dp((cnt[1]+1)*B*C*D,-INF);
    dp[0]=score[0];
    for (int a=0;a<=cnt[1];a++)
    for (int b=0;b<=cnt[2];b++)
    for (int c=0;c<=cnt[3];c++)
    for (int d=0;d<=cnt[4];d++) {
        if (!a&&!b&&!c&&!d) continue;
        ll best=-INF;
        if (a) best=max(best,dp[id(a-1,b,c,d)]);
        if (b) best=max(best,dp[id(a,b-1,c,d)]);
        if (c) best=max(best,dp[id(a,b,c-1,d)]);
        if (d) best=max(best,dp[id(a,b,c,d-1)]);
        dp[id(a,b,c,d)]=best+score[a+2*b+3*c+4*d];
    }
    return dp.back();
}
```

### 39 路径上增加资源次数维

来源：P1544。数字三角形路径中至多 k 个位置分数乘三。

时间 $\mathcal{O}(n^2k)$，滚动空间 $\mathcal{O}(nk)$。

状态为当前位置、已用次数；初始化首点不使用和使用两种情况。
```cpp
ll resource_triangle(vector<vector<ll>> a,int K) {
    int n=a.size(); K=min(K,n);
    auto dp=vector(n,vector<ll>(K+1,-INF));
    dp[0][0]=a[0][0];
    if (K) dp[0][1]=3*a[0][0];
    for (int i=1;i<n;i++) {
        auto ndp=vector(n,vector<ll>(K+1,-INF));
        for (int j=0;j<=i;j++)
        for (int k=0;k<=K;k++)
        for (int p:{j-1,j}) {
            if (p<0||p>=i) continue;
            if (dp[p][k]!=-INF)
                ndp[j][k]=max(ndp[j][k],
                    dp[p][k]+a[i][j]);
            if (k&&dp[p][k-1]!=-INF)
                ndp[j][k]=max(ndp[j][k],
                    dp[p][k-1]+3*a[i][j]);
        }
        dp.swap(ndp);
    }
    ll ans=-INF;
    for (auto row:dp) for (ll x:row) ans=max(ans,x);
    return ans;
}
```

### 40 编辑距离与带权序列对齐

来源：P2758 / P1140。edit_distance 求增删改最少次数；align_score 按评分表最大化。

时间 $\mathcal{O}(nm)$，滚动空间 $\mathcal{O}(m)$。

空串边界必须初始化；评分表最后一行列表示空位。
```cpp
int edit_distance(string a,string b) {
    int m=b.size(); vector<int> dp(m+1);
    iota(dp.begin(),dp.end(),0);
    for (int i=1;i<=(int)a.size();i++) {
        vector<int> ndp(m+1); ndp[0]=i;
        for (int j=1;j<=m;j++)
            ndp[j]=min({dp[j]+1,ndp[j-1]+1,
                dp[j-1]+(a[i-1]!=b[j-1])});
        dp.swap(ndp);
    }
    return dp[m];
}
ll align_score(vector<int> a,vector<int> b,
    vector<vector<ll>> s,int gap) {
    int m=b.size(); vector<ll> dp(m+1);
    for (int j=1;j<=m;j++)
        dp[j]=dp[j-1]+s[gap][b[j-1]];
    for (int x:a) {
        vector<ll> ndp(m+1);
        ndp[0]=dp[0]+s[x][gap];
        for (int j=1;j<=m;j++)
            ndp[j]=max({dp[j-1]+s[x][b[j-1]],
                dp[j]+s[x][gap],
                ndp[j-1]+s[gap][b[j-1]]});
        dp.swap(ndp);
    }
    return dp[m];
}
```

### 41 子串分段计数

来源：P2679。从 a 中依次取恰好 K 个非空不重叠子串，拼成 b 的方案数。

时间 $\mathcal{O}(|a||b|K)$，空间 $\mathcal{O}(|b|K)$。

末位选或不选必须分开；相邻两段也可单独计段。
```cpp
ll substring_count(string a,string b,int K,ll mod) {
    int m=b.size();
    using State=array<ll,2>;
    auto dp=vector(m+1,vector<State>(K+1));
    dp[0][0][0]=1;
    for (char ch:a) {
        auto ndp=vector(m+1,vector<State>(K+1));
        ndp[0][0][0]=1;
        for (int j=1;j<=m;j++)
        for (int k=1;k<=K;k++) {
            ndp[j][k][0]=(dp[j][k][0]+dp[j][k][1])%mod;
            if (ch==b[j-1])
                ndp[j][k][1]=(dp[j-1][k][1]+
                    dp[j-1][k-1][0]+dp[j-1][k-1][1])%mod;
        }
        dp.swap(ndp);
    }
    return (dp[m][K][0]+dp[m][K][1])%mod;
}
```

### 42 石子合并：线性与环形

来源：P1775 / P1880。merge_stones(a,ring) 返回最小与最大合并代价。

时间 $\mathcal{O}(n^3)$，空间 $\mathcal{O}(n^2)$。

只能合并相邻堆；环形复制数组后只计算长度不超过 n 的区间。
```cpp
pair<ll,ll> merge_stones(vector<ll> a,bool ring) {
    int n=a.size();
    if (ring) { auto b=a; a.insert(a.end(),b.begin(),b.end()); }
    int N=a.size(); vector<ll> pre(N+1);
    for (int i=0;i<N;i++) pre[i+1]=pre[i]+a[i];
    auto lo=vector(N,vector<ll>(N,INF));
    auto hi=vector(N,vector<ll>(N,-INF));
    for (int i=0;i<N;i++) lo[i][i]=hi[i][i]=0;
    for (int len=2;len<=n;len++)
    for (int l=0;l+len<=N;l++) {
        int r=l+len-1; ll w=pre[r+1]-pre[l];
        for (int k=l;k<r;k++) {
            lo[l][r]=min(lo[l][r],lo[l][k]+lo[k+1][r]+w);
            hi[l][r]=max(hi[l][r],hi[l][k]+hi[k+1][r]+w);
        }
    }
    ll mn=INF,mx=-INF;
    for (int l=0;l<(ring?n:1);l++) {
        mn=min(mn,lo[l][l+n-1]);
        mx=max(mx,hi[l][l+n-1]);
    }
    return {mn,mx};
}
```

### 43 能量项链与带操作数的区间 DP

来源：P1063 / P1388。necklace 求环形项链收益；expression 求恰 k 个乘号的最大表达式值。

项链 $\mathcal{O}(n^3)$；表达式 $\mathcal{O}(n^3k^2)$，空间 $\mathcal{O}(n^2k)$。

表达式数组必须非负，否则乘法要同时保存最小值和最大值。
```cpp
ll necklace(vector<ll> a) {
    int n=a.size(); auto b=a;
    a.insert(a.end(),b.begin(),b.end());
    auto dp=vector(2*n,vector<ll>(2*n));
    for (int len=3;len<=n+1;len++)
    for (int l=0;l+len<=2*n;l++) {
        int r=l+len-1;
        for (int k=l+1;k<r;k++)
            dp[l][r]=max(dp[l][r],dp[l][k]+dp[k][r]
                +a[l]*a[k]*a[r]);
    }
    ll ans=0;
    for (int l=0;l<n;l++) ans=max(ans,dp[l][l+n]);
    return ans;
}
ll expression(vector<ll> a,int K) {
    int n=a.size();
    auto dp=vector(n,vector(n,vector<ll>(K+1,-INF)));
    for (int i=0;i<n;i++) dp[i][i][0]=a[i];
    for (int len=2;len<=n;len++)
    for (int l=0;l+len<=n;l++) {
        int r=l+len-1;
        for (int m=l;m<r;m++)
        for (int u=0;u<=K;u++)
        for (int v=0;u+v<=K;v++) {
            ll x=dp[l][m][u],y=dp[m+1][r][v];
            if (x==-INF||y==-INF) continue;
            dp[l][r][u+v]=max(dp[l][r][u+v],x+y);
            if (u+v<K)
                dp[l][r][u+v+1]=max(dp[l][r][u+v+1],x*y);
        }
    }
    return dp[0][n-1][K];
}
```

### 44 涂色与回文

来源：P4170 / P7414 / P1435。paint 求覆盖成目标序列的最少笔数；palindrome 求补成回文最少插入数。

涂色 $\mathcal{O}(n^3)$，回文 $\mathcal{O}(n^2)$，空间 $\mathcal{O}(n^2)$。

同端点颜色可合并；回文同端点使用内层空区间零值。
```cpp
int paint(vector<int> a) {
    int n=a.size(); if (!n) return 0;
    auto dp=vector(n,vector<int>(n));
    for (int i=0;i<n;i++) dp[i][i]=1;
    for (int len=2;len<=n;len++)
    for (int l=0;l+len<=n;l++) {
        int r=l+len-1; dp[l][r]=n;
        if (a[l]==a[r]) dp[l][r]=dp[l+1][r];
        else for (int k=l;k<r;k++)
            dp[l][r]=min(dp[l][r],dp[l][k]+dp[k+1][r]);
    }
    return dp[0][n-1];
}
int palindrome(string s) {
    int n=s.size(); if (!n) return 0;
    auto dp=vector(n,vector<int>(n));
    for (int len=2;len<=n;len++)
    for (int l=0;l+len<=n;l++) {
        int r=l+len-1;
        if (s[l]==s[r]) dp[l][r]=len==2?0:dp[l+1][r-1];
        else dp[l][r]=min(dp[l+1][r],dp[l][r-1])+1;
    }
    return dp[0][n-1];
}
```

### 45 区间端点状态计数

来源：P3205。dp[l][r][0/1] 区分新加入的是左端还是右端。

时间 $\mathcal{O}(n^2)$，空间 $\mathcal{O}(n^2)$。

单元素只计一次；相等时不能按严格大小关系转移。
```cpp
ll choir(vector<int> a,ll mod=19650827) {
    int n=a.size();
    auto dp=vector(n,vector<array<ll,2>>(n));
    for (int i=0;i<n;i++) dp[i][i][0]=1;
    for (int len=2;len<=n;len++)
    for (int l=0;l+len<=n;l++) {
        int r=l+len-1;
        if (a[l]<a[l+1]) dp[l][r][0]+=dp[l+1][r][0];
        if (a[l]<a[r]) dp[l][r][0]+=dp[l+1][r][1];
        if (a[r]>a[l]) dp[l][r][1]+=dp[l][r-1][0];
        if (a[r]>a[r-1]) dp[l][r][1]+=dp[l][r-1][1];
        dp[l][r][0]%=mod; dp[l][r][1]%=mod;
    }
    return (dp[0][n-1][0]+dp[0][n-1][1])%mod;
}
```

### 46 文法合并可行性

来源：P4290。a[i] 为 0..3；rule[x][y] 列出两符号能合成的符号。

固定四种符号时 $\mathcal{O}(n^3)$，空间 $\mathcal{O}(n^2)$。

只保存可行性；答案为全区间能合成的所有符号。
```cpp
array<int,4> grammar(vector<int> a,
    vector<vector<vector<int>>> rule) {
    int n=a.size();
    auto dp=vector(n,vector<array<int,4>>(n));
    for (int i=0;i<n;i++) dp[i][i][a[i]]=1;
    for (int len=2;len<=n;len++)
    for (int l=0;l+len<=n;l++) {
        int r=l+len-1;
        for (int k=l;k<r;k++)
        for (int x=0;x<4;x++) if (dp[l][k][x])
        for (int y=0;y<4;y++) if (dp[k+1][r][y])
            for (int z:rule[x][y]) dp[l][r][z]=1;
    }
    return dp[0][n-1];
}
```

### 47 树形 DP：独立集

来源：P1352。每条边两端不能同时选，求最大点权独立集。

时间 $\mathcal{O}(n)$，空间 $\mathcal{O}(n)$。

点从 0 开始；dp[x][1] 只能接儿子不选，dp[x][0] 可接两种。
```cpp
ll tree_independent(vector<vector<int>> g,
    vector<ll> w,int root=0) {
    vector<array<ll,2>> dp(g.size());
    function<void(int,int)> dfs=[&](int x,int p) {
        dp[x][1]=w[x];
        for (int y:g[x]) if (y!=p) {
            dfs(y,x);
            dp[x][1]+=dp[y][0];
            dp[x][0]+=max(dp[y][0],dp[y][1]);
        }
    };
    dfs(root,-1);
    return max(dp[root][0],dp[root][1]);
}
```

### 48 树形背包：前置依赖与精确数量

来源：P2014 / T797360。parent[1..n] 为先修节点，0 为虚根；恰选 m 个实际节点。

朴素上界 $\mathcal{O}(nm^2)$，截断有效子树容量后通常更小。

真实节点必须先选自身才能选后代；不能用零表示不可达。
```cpp
ll tree_knapsack(vector<int> parent,
    vector<ll> value,int m) {
    int n=parent.size()-1;
    vector<vector<int>> ch(n+1);
    for (int x=1;x<=n;x++) ch[parent[x]].push_back(x);
    vector<vector<ll>> dp(n+1);
    function<void(int)> dfs=[&](int x) {
        dp[x]={0}; if (x) dp[x].push_back(value[x]);
        for (int y:ch[x]) {
            dfs(y);
            int cap=min(m,(int)dp[x].size()+
                (int)dp[y].size()-2);
            vector<ll> ndp(cap+1,-INF);
            for (int i=0;i<(int)dp[x].size();i++)
            for (int j=0;j<(int)dp[y].size();j++) {
                if (i+j>cap||(x&&i==0&&j>0)) continue;
                if (dp[x][i]==-INF||dp[y][j]==-INF) continue;
                ndp[i+j]=max(ndp[i+j],dp[x][i]+dp[y][j]);
            }
            dp[x].swap(ndp);
        }
    }; dfs(0);
    return m<(int)dp[0].size()?dp[0][m]:-INF;
}
// 双目标：状态改成 {收益,风险}，先比收益最大再比风险最小。
// 风险的合并式取决于题意，不能一律相加或取 max。
```

### 49 DAG 最长路径、计数与记忆化

来源：P2196 / P4017 / P1434。max_path 求任意起点非空路径最大点权和；count_paths 求所有源到汇路径数。

时间、空间 $\mathcal{O}(n+m)$。

必须保证无环。网格高度严格变化可据此建 DAG。
```cpp
ll max_path(vector<vector<int>> g,vector<ll> w) {
    int n=g.size(); vector<ll> dp(n);
    vector<bool> seen(n);
    function<ll(int)> dfs=[&](int x)->ll {
        if (seen[x]) return dp[x];
        seen[x]=true; dp[x]=w[x];
        for (int y:g[x]) dp[x]=max(dp[x],w[x]+dfs(y));
        return dp[x];
    };
    ll ans=-INF;
    for (int x=0;x<n;x++) ans=max(ans,dfs(x));
    return ans;
}
ll count_paths(vector<vector<int>> g,ll mod) {
    int n=g.size(); vector<int> in(n);
    vector<ll> dp(n,-1);
    for (auto v:g) for (int y:v) in[y]++;
    function<ll(int)> dfs=[&](int x)->ll {
        if (dp[x]!=-1) return dp[x];
        dp[x]=g[x].empty()?1:0;
        for (int y:g[x]) dp[x]=(dp[x]+dfs(y))%mod;
        return dp[x];
    };
    ll ans=0;
    for (int x=0;x<n;x++) if (!in[x])
        ans=(ans+dfs(x))%mod;
    return ans;
}
```

### 50 等差子序列计数与进出栈方案

来源：P4933 / P1044。arithmetic 包含长度一的子序列；stack_count 统计 n 个元素的合法出栈序列。

均 $\mathcal{O}(n^2)$ 时间；差值 map 最坏 $\mathcal{O}(n^2)$ 空间。

差值用 ll；栈方案无取模版本要求 n<=35。
```cpp
ll arithmetic(vector<ll> a,ll mod=998244353) {
    int n=a.size(); ll ans=n%mod;
    vector<unordered_map<ll,ll>> dp(n);
    for (int i=0;i<n;i++) for (int j=0;j<i;j++) {
        ll d=a[i]-a[j];
        ll ways=(dp[j][d]+1)%mod;
        dp[i][d]=(dp[i][d]+ways)%mod;
        ans=(ans+ways)%mod;
    }
    return ans;
}
ll stack_count(int n) {
    auto dp=vector(n+2,vector<ll>(n+2));
    for (int a=0;a<=n;a++) dp[a][0]=1;
    for (int a=n-1;a>=0;a--)
        for (int i=1;i<=n-a;i++)
            dp[a][i]=dp[a+1][i]+dp[a][i-1];
    return dp[0][n];
}
```

### 51 有序集合优化滑窗转移

来源：P1725 / T797335。dp[i]=a[i]+max(dp[j])，i-R<=j<=i-L，dp[0]=0。

时间 $\mathcal{O}(n \log R)$，空间 $\mathcal{O}(n+R)$。

L>=1；a[0] 不计入收益。删除时只删一份相等值。
```cpp
vector<ll> window_dp(vector<ll> a,int L,int R) {
    int n=a.size(); vector<ll> dp(n,-INF);
    dp[0]=0; multiset<ll> s;
    for (int i=1;i<n;i++) {
        int out=i-R-1,in=i-L;
        if (out>=0&&dp[out]!=-INF)
            s.erase(s.find(dp[out]));
        if (in>=0&&dp[in]!=-INF) s.insert(dp[in]);
        if (!s.empty()) dp[i]=a[i]+*s.rbegin();
    }
    return dp;
}
// 奇偶/类别奖励：每种类别独立维护集合，比较加奖励后的最优值。
// 允许跳出终点：取可在下一跳到达终点的最后 R 个位置。
```

### 52 堆优化带偏移的窗口转移

来源：P1070。dp[i]=a[i]+max(dp[j]+b[j])，i-R<=j<=i-L；从 dp[0]=0 出发。

时间 $\mathcal{O}(n \log n)$，空间 $\mathcal{O}(n)$。

堆内带下标，过期元素到达堆顶时才弹出。轨迹类状态分别维护堆。
```cpp
vector<ll> heap_dp(vector<ll> a,vector<ll> b,
    int L,int R) {
    int n=a.size(); vector<ll> dp(n,-INF); dp[0]=0;
    priority_queue<pair<ll,int>> q;
    for (int i=1;i<n;i++) {
        int j=i-L;
        if (j>=0&&dp[j]!=-INF)
            q.push({dp[j]+b[j],j});
        while (!q.empty()&&q.top().second<i-R) q.pop();
        if (!q.empty()) dp[i]=a[i]+q.top().first;
    }
    return dp;
}
```

### 53 按位优化子序列转移

来源：P4310。求最长子序列，使相邻两个选中数按位与非零。

时间 $\mathcal{O}(63n)$，空间 $\mathcal{O}(63)$。

先查询所有置位位置，再统一更新，防止一个元素被重复使用。
```cpp
int bit_sequence(vector<ll> a) {
    int best[63]{},ans=0;
    for (ll x:a) {
        int cur=1;
        for (int b=0;b<63;b++) if (x>>b&1)
            cur=max(cur,best[b]+1);
        for (int b=0;b<63;b++) if (x>>b&1)
            best[b]=max(best[b],cur);
        ans=max(ans,cur);
    }
    return ans;
}
// 是按位分类的线性 DP，不是枚举子集的状压 DP。
```

### 54 保序选择与方案恢复

来源：P1854。score[i][j] 为第 i 件放在第 j 位的收益；按原顺序放所有物品。

n 件、m 位置：$\mathcal{O}(nm)$ 时间和空间。

要求 n<=m；负分状态用 -INF；通过 take 数组回溯选中位置。
```cpp
pair<ll,vector<int>> arrange(vector<vector<ll>> s) {
    int n=s.size(),m=s[0].size();
    auto dp=vector(n+1,vector<ll>(m+1,-INF));
    auto take=vector(n+1,vector<bool>(m+1));
    for (int j=0;j<=m;j++) dp[0][j]=0;
    for (int i=1;i<=n;i++) for (int j=1;j<=m;j++) {
        dp[i][j]=dp[i][j-1];
        if (dp[i-1][j-1]!=-INF&&
            dp[i-1][j-1]+s[i-1][j-1]>dp[i][j]) {
            dp[i][j]=dp[i-1][j-1]+s[i-1][j-1];
            take[i][j]=true;
        }
    }
    vector<int> pos; int i=n,j=m;
    while (i>0&&j>0) {
        if (take[i][j]) pos.push_back(j-1),i--;
        j--;
    }
    reverse(pos.begin(),pos.end());
    return {dp[n][m],pos};
}
```

### 55 改变状态：合并值到最早右端点

来源：P3147。相邻相同数可合为加一，求能出现的最大值。

值域上界 V 时 $\mathcal{O}(nV)$ 时间与空间。

适用于初值较小的题。right[v][l] 表示合成 v 的最早结束位置。
```cpp
int merge_values(vector<int> a) {
    int n=a.size(),V=*max_element(a.begin(),a.end());
    for (int x=n;x>1;x>>=1) V++;
    V++;
    auto right=vector(V+1,vector<int>(n,-1));
    for (int i=0;i<n;i++) right[a[i]][i]=i;
    int ans=0;
    for (int v=0;v<=V;v++) for (int l=0;l<n;l++) {
        if (v&&right[v][l]==-1) {
            int r=right[v-1][l];
            if (r!=-1&&r+1<n)
                right[v][l]=right[v-1][r+1];
        }
        if (right[v][l]!=-1) ans=max(ans,v);
    }
    return ans;
}
```
