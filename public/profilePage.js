(async function () {
    const form = document.getElementById("profileForm");
    const statusEl = document.getElementById("status");
    const emailInput = document.getElementById("userEmail");
    const nameInput = document.getElementById("fullName");
    const stateInput = document.getElementById("state");
    const zipInput = document.getElementById("zipcode");
    const skillsInput = document.getElementById("skills");
  
    const CURRENT_EMAIL = "me@uh.edu";
    emailInput.value = CURRENT_EMAIL;
  
    function setStatus(msg, ok = true) {
      statusEl.textContent = msg;
      statusEl.style.color = ok ? "green" : "red";
    }
  
    async function loadProfile() {
      const res = await fetch(`/api/profile/${encodeURIComponent(CURRENT_EMAIL)}`);
      if (res.status === 404) return setStatus("No profile found. Create one.");
      const data = await res.json();
      nameInput.value = data.fullName || "";
      stateInput.value = data.state || "";
      zipInput.value = data.zipcode || "";
      skillsInput.value = (data.skills || []).join(", ");
      setStatus("Profile loaded.");
    }
  
    async function saveProfile(e) {
      e.preventDefault();
      const body = {
        userEmail: CURRENT_EMAIL,
        fullName: nameInput.value.trim(),
        state: stateInput.value.trim(),
        zipcode: zipInput.value.trim(),
        skills: skillsInput.value.split(",").map(s => s.trim()),
      };
      const method = (await fetch(`/api/profile/${CURRENT_EMAIL}`)).status === 404 ? "POST" : "PATCH";
      const res = await fetch(`/api/profile${method === "PATCH" ? "/" + CURRENT_EMAIL : ""}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setStatus(res.ok ? "Saved!" : "Failed to save.", res.ok);
    }
  
    form.addEventListener("submit", saveProfile);
    await loadProfile();
  })();
  