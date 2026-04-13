// Codeforces Round 1093 (Div. 2) - C. Grid L
// https://mirror.codeforces.com/contest/2220/problem/C
//
// Total unit edges: E = p + 2q. Grid n x m has E = 2nm + n + m, i.e.
// 2E + 1 = (2n + 1)(2m + 1) = T.
//
// Not every odd factorization yields a valid tiling: one also needs enough
// vertical and horizontal edges to place q L-shapes:
//   n(m + 1) >= q  and  (n + 1)m >= q
// (each L uses one horizontal and one vertical unit edge at its corner).

#include <bits/stdc++.h>
using namespace std;

using int64 = long long;

static bool is_prime_int64(int64 n) {
    if (n < 2) return false;
    if (n % 2 == 0) return n == 2;
    for (int64 d = 3; d * d <= n; d += 2) {
        if (n % d == 0) return false;
    }
    return true;
}

static bool ok_dims(int64 n, int64 m, int64 q) {
    return n * (m + 1) >= q && (n + 1) * m >= q;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int Tcases;
    if (!(cin >> Tcases)) return 0;
    while (Tcases--) {
        int64 p, q;
        cin >> p >> q;
        int64 edges = p + 2 * q;
        int64 T = 2 * edges + 1;

        if (T < 9) {
            cout << -1 << '\n';
            continue;
        }
        if (is_prime_int64(T)) {
            cout << -1 << '\n';
            continue;
        }

        int64 best_n = -1, best_m = -1;
        int64 best_diff = LLONG_MAX;

        for (int64 d = 3; d * d <= T; d += 2) {
            if (T % d) continue;
            int64 a = d, b = T / d;
            int64 n = (a - 1) / 2, m = (b - 1) / 2;
            if (n < 1 || m < 1) continue;

            if (ok_dims(n, m, q)) {
                int64 diff = llabs(n - m);
                if (diff < best_diff || (diff == best_diff && n < best_n)) {
                    best_diff = diff;
                    best_n = n;
                    best_m = m;
                }
            }
            if (a != b) {
                swap(n, m);
                if (ok_dims(n, m, q)) {
                    int64 diff = llabs(n - m);
                    if (diff < best_diff || (diff == best_diff && n < best_n)) {
                        best_diff = diff;
                        best_n = n;
                        best_m = m;
                    }
                }
            }
        }

        if (best_n < 0) {
            cout << -1 << '\n';
        } else {
            cout << best_n << ' ' << best_m << '\n';
        }
    }
    return 0;
}
