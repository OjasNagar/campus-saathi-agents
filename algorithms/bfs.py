from collections import deque

from agents.base_agent import BaseAgent
from algorithms.astar import SearchResult, action_cost


def bfs_search(problem, initial_state=None):
    """Breadth First Search.

    Complete for finite state spaces.
    Optimal when every action has equal cost.
    Time: O(b^d), Space: O(b^d).
    """
    start = problem.initial_state() if initial_state is None else initial_state

    queue = deque([start])
    parent = {start: None}
    expanded = 0
    generated = 0
    goal = None

    while queue:
        state = queue.popleft()

        if problem.goal_test(state):
            goal = state
            break

        expanded += 1

        for action in problem.actions(state):
            nxt = problem.result(state, action)

            if nxt not in parent:
                parent[nxt] = (state, action)
                queue.append(nxt)
                generated += 1

    if goal is None:
        return SearchResult(None, float("inf"), expanded, generated)

    plan = []
    state = goal

    while parent[state] is not None:
        prev, action = parent[state]
        plan.append(action)
        state = prev

    plan.reverse()

    cost = 0.0
    state = start
    for action in plan:
        travel, service = action_cost(problem, state, action)
        nxt = problem.result(state, action)
        cost = problem.path_cost(
            cost, state, action, nxt,
            travel_time=travel, service_time=service
        )
        state = nxt

    return SearchResult(plan, cost, expanded, generated, goal)


class BFSAgent(BaseAgent):
    """Agent that plans using Breadth First Search."""

    def __init__(self, problem, name="BFSAgent"):
        super().__init__(problem, name)
        self._plan = []
        self._expected_state = None
        self.last_result = None

    def select_action(self, state, metrics):
        state = (state[0], frozenset(state[1]))

        if self.problem.goal_test(state):
            return None

        if not self._plan or state != self._expected_state:
            self.last_result = bfs_search(self.problem, state)
            self._plan = list(self.last_result.plan or [])

            if metrics is not None:
                metrics.increment_node_expansion(
                    self.last_result.nodes_expanded
                )

        if not self._plan:
            return None

        action = self._plan.pop(0)
        self._expected_state = self.problem.result(state, action)
        return action

    def reset(self):
        self._plan = []
        self._expected_state = None
        self.last_result = None
