// Grid path with o/x constraints — BFS on (cell, previous move), equivalent to
// memoized shortest path. H,W <= 1000 => at most 5e6 states.

#include <bits/stdc++.h>
using namespace std;

struct Coord {
    int r, c;
};

static const int DR[4] = {-1, 1, 0, 0};
static const int DC[4] = {0, 0, -1, 1};
static const char MOVE_CH[4] = {'U', 'D', 'L', 'R'};

inline int idx(int r, int c, int d, int W) { return ((r * W + c) * 5 + d); }

inline bool ok_next_move(char ch, int prev_dir, int nd) {
    // prev_dir: 0 = none (start on S), 1..4 = U,D,L,R used to enter current cell
    if (ch == 'o') {
        if (prev_dir == 0) return false; // should not happen on valid states
        return nd == prev_dir - 1;
    }
    if (ch == 'x') {
        if (prev_dir == 0) return true;
        return nd != prev_dir - 1;
    }
    // '.', 'S', 'G', '#' never reached here for '#'
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int H, W;
    if (!(cin >> H >> W)) return 0;
    vector<string> g(H);
    for (int i = 0; i < H; ++i) cin >> g[i];

    Coord start{-1, -1}, goal{-1, -1};
    for (int i = 0; i < H; ++i) {
        for (int j = 0; j < W; ++j) {
            if (g[i][j] == 'S') start = {i, j};
            if (g[i][j] == 'G') goal = {i, j};
        }
    }

    const int N = H * W * 5;
    vector<int> parent(N, -1);
    vector<char> parent_move(N, 0);

    deque<int> q;
    const int s_id = idx(start.r, start.c, 0, W);
    parent[s_id] = s_id;
    q.push_back(s_id);

    int goal_state = -1;

    while (!q.empty()) {
        int cur = q.front();
        q.pop_front();
        int d = cur % 5;
        int tmp = cur / 5;
        int c = tmp % W;
        int r = tmp / W;

        if (r == goal.r && c == goal.c) {
            goal_state = cur;
            break;
        }

        char ch = g[r][c];
        for (int nd = 0; nd < 4; ++nd) {
            if (!ok_next_move(ch, d, nd)) continue;
            int nr = r + DR[nd];
            int nc = c + DC[nd];
            if (nr < 0 || nr >= H || nc < 0 || nc >= W) continue;
            if (g[nr][nc] == '#') continue;
            int nid = idx(nr, nc, nd + 1, W);
            if (parent[nid] != -1) continue;
            parent[nid] = cur;
            parent_move[nid] = MOVE_CH[nd];
            q.push_back(nid);
        }
    }

    if (goal_state == -1) {
        cout << "No\n";
        return 0;
    }

    string path_rev;
    for (int v = goal_state; v != s_id; v = parent[v]) {
        path_rev.push_back(parent_move[v]);
    }
    reverse(path_rev.begin(), path_rev.end());

    cout << "Yes\n";
    cout << path_rev << '\n';
    return 0;
}
