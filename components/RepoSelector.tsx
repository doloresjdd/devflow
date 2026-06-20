type Repo = { id: string; name: string; fullName: string };

export function RepoSelector({
  repos,
  selected,
  onSelect,
}: {
  repos: Repo[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (repos.length === 0) {
    return (
      <span className="text-sm text-gray-500">No repos tracked yet</span>
    );
  }

  return (
    <select
      value={selected ?? ""}
      onChange={(e) => onSelect(e.target.value)}
      className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm"
    >
      {repos.map((r) => (
        <option key={r.id} value={r.id}>
          {r.fullName}
        </option>
      ))}
    </select>
  );
}
