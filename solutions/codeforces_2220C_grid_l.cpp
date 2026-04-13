// Codeforces Round 1093 (Div. 2) - C. Grid L
// https://mirror.codeforces.com/contest/2220/problem/C
//
// Each unit segment contributes one unit edge; each L contributes two.
// An n x m grid of unit squares has E = 2nm + n + m unit edges, so
// 2E + 1 = (2n + 1)(2m + 1) with 2E + 1 = 2(p + 2q) + 1.
// Feasible iff T = 2(p + 2q) + 1 is composite and T >= 9 (so n, m >= 1).

#include <bits/stdc++.h>
using namespace std;

static bool is_prime_int64(int64_t n) {
    if (n < 2) return false;
    if (n % 2 == 0) return n == 2;
    for (int64_t d = 3; d * d <= n; d += 2) {
        if (n % d == 0) return false;
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int Tcases;
    if (!(cin >> Tcases)) return 0;
    while (Tcases--) {
        int64_t p, q;
        cin >> p >> q;
        int64_t edges = p + 2 * q;
        int64_t T = 2 * edges + 1;

        if (T < 9 || is_prime_int64(T)) {
            cout << -1 << '\n';
            continue;
        }

        // T = (2n+1)(2m+1); pick odd factors a <= b with a*b = T so that b - a is
        // minimal (a closest to sqrt(T)), matching canonical constructions.
        int64_t a = -1;
        for (int64_t d = 3; d * d <= T; d += 2) {
            if (T % d == 0) a = d;
        }
        int64_t b = T / a;
        int64_t n = (a - 1) / 2;
        int64_t m = (b - 1) / 2;
        cout << n << ' ' << m << '\n';
    }
    return 0;
}
