// Primary Atomize — calls the BreadCrumbAlgo backend (/projects)
export async function atomizeProject(projectName, category) {
  const response = await fetch("http://localhost:8000/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_name: projectName, category }),
  });
  if (!response.ok) throw new Error(`Backend error: ${response.status}`);
  return response.json();
}

// Legacy alias kept for any imports still using /atomize
export async function atomizeProjectLegacy(projectName, category) {
  const response = await fetch("http://localhost:8000/atomize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_name: projectName, category }),
  });
  if (!response.ok) throw new Error(`Backend error: ${response.status}`);
  return response.json();
}
