from agents.base_agent import BaseAgent
from algorithms.astar import SearchResult, action_cost


def ids_search(problem, initial_state=None):
    """Iterative Deepening Search.

    Complete for finite state spaces.
    Optimal when every action has equal cost.
    Time: O(b^d) in the standard tree-search analysis.
    Space: O(b*d), with additional state memory for duplicate detection.
    """
    start = problem.initial_state() if initial_state is None else initial_state

    expanded = 0
    generated = 0
    answer = None

    def depth_limited(state, limit, path, seen):
        nonlocal expanded, generated

        if problem.goal_test(state):
            return []

        if limit == 0:
            return None

        # Skip a state if it was already explored with more remaining depth.
        if seen.get(state, -1) >= limit:
            return None

        seen[state] = limit
        expanded += 1

        for action in problem.actions(state):
            nxt = problem.result(state, action)

            if nxt in path:
                continue

            generated += 1
            path.add(nxt)

            result = depth_limited(nxt, limit - 1, path, seen)

            if result is not None:
                return [action] + result

            path.remove(nxt)

        return None

    max_depth = len(problem.graph.nodes) * (2 ** len(problem.goal_steps)) - 1

    for depth in range(max_depth + 1):
        answer = depth_limited(start, depth, {start}, {})

        if answer is not None:
            break

    if answer is None:
        return SearchResult(None, float("inf"), expanded, generated)

    cost = 0.0
    state = start

    for action in answer:
        travel, service = action_cost(problem, state, action)
        nxt = problem.result(state, action)
        cost = problem.path_cost(
            cost, state, action, nxt,
            travel_time=travel, service_time=service
        )
        state = nxt

    return SearchResult(answer, cost, expanded, generated, state)


class IDSAgent(BaseAgent):
    """Agent that plans using Iterative Deepening Search."""

    def __init__(self, problem, name="IDSAgent"):
        super().__init__(problem, name)
        self._plan = []
        self._expected_state = None
        self.last_result = None

    def select_action(self, state, metrics):
        state = (state[0], frozenset(state[1]))

        if self.problem.goal_test(state):
            return None

        if not self._plan or state != self._expected_state:
            self.last_result = ids_search(self.problem, state)
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
