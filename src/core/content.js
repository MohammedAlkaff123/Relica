// Loads a JSON file from the project. Paths are relative to index.html.
export async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`could not load ${path} (${res.status})`);
  return res.json();
}
