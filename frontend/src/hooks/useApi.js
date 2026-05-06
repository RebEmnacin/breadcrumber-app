export async function atomizeProject(projectName, category) {
  const response = await fetch("http://localhost:8000/atomize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      project_name: projectName,
      category: category,
    }),
  });
  const data = await response.json();
  return data;
}
