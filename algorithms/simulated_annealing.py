import math

import numpy as np

from agents.base_agent import BaseAgent
from core.seeding import get_rng

SCHEDULES = ("exponential", "linear")


def travel_cost(dist, start, order):
    """Total shortest-path travel time of visiting rooms in the given order from start."""
    total = 0.0
    here = start
    for room in order:
        total += dist[here][room]
        here = room
    return total


def optimal_order(dist, start, rooms):
    """Exact best visiting order and its travel cost, found with Held-Karp dynamic programming."""
    rooms = list(rooms)
    n = len(rooms)
    if n == 0:
        return [], 0.0

    inf = float("inf")
    best = [[inf] * n for _ in range(1 << n)]
    parent = [[-1] * n for _ in range(1 << n)]
    for i, room in enumerate(rooms):
        best[1 << i][i] = dist[start][room]

    for mask in range(1, 1 << n):
        for last in range(n):
            cost = best[mask][last]
            if cost == inf:
                continue
            for nxt in range(n):
                if mask >> nxt & 1:
                    continue
                grown = mask | 1 << nxt
                candidate = cost + dist[rooms[last]][rooms[nxt]]
                if candidate < best[grown][nxt]:
                    best[grown][nxt] = candidate
                    parent[grown][nxt] = last

    full = (1 << n) - 1
    last = min(range(n), key=lambda i: best[full][i])
    total = best[full][last]
    order = []
    mask = full
    while last != -1:
        order.append(rooms[last])
        previous = parent[mask][last]
        mask ^= 1 << last
        last = previous
    return order[::-1], total


class SimulatedAnnealingAgent(BaseAgent):
    """Plans the order of room visits with simulated annealing, then walks that plan.

    Travel and service times are fixed, so only the visiting order changes the
    total cost and the annealer minimises travel time. Neighbouring orders come
    from swap and insert mutations. The temperature falls from initial_temp to
    min_temp following an exponential or linear schedule, and the search is
    restarted from a fresh random order several times.
    """

    def __init__(self, problem, schedule="exponential", initial_temp=50.0,
                 cooling_rate=0.995, min_temp=0.01, restarts=5, seed=42):
        super().__init__(problem, name="SimulatedAnnealingAgent")
        if schedule not in SCHEDULES:
            raise ValueError(f"schedule must be one of {SCHEDULES}")
        if not 0 < cooling_rate < 1:
            raise ValueError("cooling_rate must be between 0 and 1")
        if not 0 < min_temp < initial_temp:
            raise ValueError("min_temp must be positive and below initial_temp")
        if restarts < 1:
            raise ValueError("restarts must be at least 1")

        self.schedule = schedule
        self.initial_temp = initial_temp
        self.cooling_rate = cooling_rate
        self.min_temp = min_temp
        self.restarts = restarts
        self.seed = seed

        nodes = sorted(problem.graph.nodes)
        self.dist = {a: {b: problem.graph.shortest_path_weight(a, b) for b in nodes} for a in nodes}
        self.plan = None
        self.plan_cost = None
        self.trace = []

    def temperatures(self):
        """Yield the temperature of every annealing step for one restart."""
        temp = self.initial_temp
        drop = (1 - self.cooling_rate) * self.initial_temp
        while temp > self.min_temp:
            yield temp
            temp = temp * self.cooling_rate if self.schedule == "exponential" else temp - drop

    def _neighbour(self, order, rng):
        candidate = list(order)
        i, j = rng.choice(len(candidate), size=2, replace=False)
        if rng.random() < 0.5:
            candidate[i], candidate[j] = candidate[j], candidate[i]
        else:
            candidate.insert(j, candidate.pop(i))
        return candidate

    def anneal(self, start, pending):
        """Search for a cheap visiting order of the pending rooms, returning (order, travel cost)."""
        pending = sorted(pending)
        self.trace = []
        if len(pending) < 2:
            return pending, travel_cost(self.dist, start, pending)

        rng = get_rng(self.seed)
        best_order, best_cost = None, math.inf
        for _ in range(self.restarts):
            current = [pending[i] for i in rng.permutation(len(pending))]
            current_cost = travel_cost(self.dist, start, current)
            for temp in self.temperatures():
                candidate = self._neighbour(current, rng)
                candidate_cost = travel_cost(self.dist, start, candidate)
                delta = candidate_cost - current_cost
                if delta <= 0 or rng.random() < math.exp(-delta / temp):
                    current, current_cost = candidate, candidate_cost
                if current_cost < best_cost:
                    best_order, best_cost = list(current), current_cost
                self.trace.append(best_cost)
        return best_order, best_cost

    def select_action(self, state, metrics=None):
        """Complete the next planned room when standing in it, otherwise step toward it."""
        room, completed = state
        if self.problem.goal_test(state):
            return None

        pending = {r for r in self.problem.steps_config if r not in completed}
        remaining = [r for r in (self.plan or []) if r in pending]
        if len(remaining) != len(pending):
            remaining, self.plan_cost = self.anneal(room, pending)
        self.plan = remaining

        target = remaining[0]
        if room == target:
            return ("complete", room)
        neighbors = self.problem.graph.get_neighbors(room)
        step = min(neighbors, key=lambda n: neighbors[n] + self.dist[n][target])
        return ("move", step)

    def reset(self):
        self.plan = None
        self.plan_cost = None
