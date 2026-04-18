// Team Division: count valid 2-team assignments with per-player team-size intervals.
// For |A| = a, player i can be placed iff a in [L_i,R_i] OR (N-a) in [L_i,R_i]
// i.e. a in A_i = [L_i,R_i] or a in B_i = [N-R_i, N-L_i].
// For fixed a: onlyA = |A_i \ (A_i∩B_i)|, onlyB symmetric, both = |A_i∩B_i|.
// Labelings for this a: choose which of `both` go to A so that |A|=a => C(both, a - onlyA).
// Sum over a in [1, N-1] when every player is feasible (bad count == 0).

#include <bits/stdc++.h>
using namespace std;

static const int MOD = 998244353;

long long mod_pow(long long a, long long e) {
  long long r = 1 % MOD;
  while (e) {
    if (e & 1) r = r * a % MOD;
    a = a * a % MOD;
    e >>= 1;
  }
  return r;
}

int main() {
  ios::sync_with_stdio(false);
  cin.tie(nullptr);

  int N;
  if (!(cin >> N)) return 0;

  vector<int> L(N), R(N);
  for (int i = 0; i < N; i++) cin >> L[i] >> R[i];

  int M = N + 3;
  vector<int> diffBad(M, 0), diffOnlyA(M, 0), diffOnlyB(M, 0), diffBoth(M, 0);

  auto add_range = [&](vector<int>& diff, int l, int r, int v) {
    if (l > r) return;
    l = max(l, 1);
    r = min(r, N - 1);
    if (l > r) return;
    diff[l] += v;
    diff[r + 1] -= v;
  };

  for (int i = 0; i < N; i++) {
    int Li = L[i], Ri = R[i];
    int Zl = N - Ri;
    int Zr = N - Li;

    int loBoth = max(Li, Zl);
    int hiBoth = min(Ri, Zr);

    // bad_i(a) = 1 - 1_{a in [Li,Ri]} - 1_{a in [Zl,Zr]} + 1_{a in both}
    add_range(diffBad, 1, N - 1, +1);
    add_range(diffBad, Li, Ri, -1);
    add_range(diffBad, Zl, Zr, -1);
    if (loBoth <= hiBoth) add_range(diffBad, loBoth, hiBoth, +1);

    if (loBoth <= hiBoth) {
      add_range(diffBoth, loBoth, hiBoth, +1);
      add_range(diffOnlyA, Li, Ri, +1);
      add_range(diffOnlyA, loBoth, hiBoth, -1);
      add_range(diffOnlyB, Zl, Zr, +1);
      add_range(diffOnlyB, loBoth, hiBoth, -1);
    } else {
      add_range(diffOnlyA, Li, Ri, +1);
      add_range(diffOnlyB, Zl, Zr, +1);
    }
  }

  vector<long long> fact(N + 1), invFact(N + 1);
  fact[0] = 1;
  for (int i = 1; i <= N; i++) fact[i] = fact[i - 1] * i % MOD;
  invFact[N] = mod_pow(fact[N], MOD - 2);
  for (int i = N; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;

  auto C = [&](int n, int k) -> int {
    if (k < 0 || k > n) return 0;
    return (int)(fact[n] * invFact[k] % MOD * invFact[n - k] % MOD);
  };

  int bad = 0, onlyA = 0, onlyB = 0, both = 0;
  int ans = 0;
  for (int a = 1; a <= N - 1; a++) {
    bad += diffBad[a];
    onlyA += diffOnlyA[a];
    onlyB += diffOnlyB[a];
    both += diffBoth[a];

    if (bad != 0) continue;
    int need = a - onlyA;
    if (need < 0 || need > both) continue;
    ans = (ans + C(both, need)) % MOD;
  }

  cout << ans << '\n';
  return 0;
}
