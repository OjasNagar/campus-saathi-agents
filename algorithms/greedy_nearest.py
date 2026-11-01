import heapq

from agents.base_agent import BaseAgent


class GreedyNearestAgent(BaseAgent):
    """Greedy agent that always selects the nearest uncompleted room.

    Not guaranteed to be complete or optimal for every problem.
    Each selection uses Dijkstra's algorithm to find the nearest task.
    Time per selection: O((V + E) log V).
    Space: O(V).
    """

    def __init__(self, problem, name="GreedyNearestAgent"):
        super().__init__(problem, name)

    def select_action(self, state, metrics):
        current, completed = state
        completed = frozenset(completed)

        if self.problem.goal_test((current, completed)):
            return None

        # Complete the task if we are already at its room.
        if current in self.problem.steps_config and current not in completed:
            return ("complete", current)

        # Find shortest distances and previous rooms from current.
        distances = {room: float("inf") for room in self.problem.graph.nodes}
        previous = {}

        distances[current] = 0
        pq = [(0, current)]
        expanded = 0

        while pq:
            dist, room = heapq.heappop(pq)

            if dist > distances[room]:
                continue

            expanded += 1

            for neighbor, weight in self.problem.graph.get_neighbors(room).items():
                new_dist = dist + weight

                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    previous[neighbor] = room
                    heapq.heappush(pq, (new_dist, neighbor))

        if metrics is not None:
            metrics.increment_node_expansion(expanded)

        # Choose the nearest uncompleted task room.
        remaining = [
            room for room in self.problem.steps_config
            if room not in completed
        ]

        if not remaining:
            return None

        target = min(remaining, key=lambda room: distances.get(room, float("inf")))

        if distances.get(target, float("inf")) == float("inf"):
            return None

        # Reconstruct the path and take only its first move.
        path = []
        room = target

        while room != current:
            path.append(room)
            room = previous[room]

        path.reverse()

        return ("move", path[0])

    def reset(self):
        pass
