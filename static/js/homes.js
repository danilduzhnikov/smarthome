const HOME_STATS_URL = "/home/api/homes/stats/";
const HOME_CREATE_URL = "/home/api/homes/";

document.addEventListener("DOMContentLoaded", () => {
    // Sidebar toggle
    const sidebar = document.getElementById("sidebar");
    const burger = document.getElementById("burger");
    if (burger && sidebar) {
        burger.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    // Modal elements
    const createBtn = document.getElementById("createHomeBtn");
    const modal = document.getElementById("homeModal");
    const modalClose = document.getElementById("modalClose");
    const modalCancel = document.getElementById("modalCancel");
    const createForm = document.getElementById("createHomeForm");
    const formError = document.getElementById("formError");
    const homeNameInput = document.getElementById("homeName");

    // Open modal
    if (createBtn && modal) {
        createBtn.addEventListener("click", () => {
            modal.classList.add("active");
            if (homeNameInput) {
                homeNameInput.focus();
            }
            if (formError) formError.textContent = "";
        });
    }

    // Close modal function
    const closeModal = () => {
        if (modal) modal.classList.remove("active");
        if (createForm) createForm.reset();
        if (formError) formError.textContent = "";
    };

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modalCancel) modalCancel.addEventListener("click", closeModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Handle form submit
    if (createForm) {
        createForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const submitBtn = createForm.querySelector('button[type="submit"]');
            const homeName = homeNameInput?.value.trim() || "";
            
            if (!homeName) {
                if (formError) formError.textContent = "Please enter a home name";
                return;
            }

            // Disable button during request
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Creating...";
            }
            if (formError) formError.textContent = "";

            try {
                const token = localStorage.getItem("access");
                
                const response = await fetch(HOME_CREATE_URL, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ name: homeName })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.name?.[0] || "Failed to create home");
                }

                // Success: close modal and reload homes
                closeModal();
                await loadHomes();
                
            } catch (error) {
                console.error("Create home error:", error);
                if (formError) {
                    formError.textContent = error.message || "Could not create home";
                }
            } finally {
                // Re-enable button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Create";
                }
            }
        });
    }

    // Initial load
    loadHomes();
});

async function loadHomes() {
    const homesGrid = document.getElementById("homesGrid");
    if (!homesGrid) return;

    try {
        const token = localStorage.getItem("access");
        const response = await fetch(HOME_STATS_URL, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("API error");
        const homes = await response.json();

        homesGrid.innerHTML = "";

        if (!homes || homes.length === 0) {
            homesGrid.innerHTML = `
                <div class="empty-homes">
                    <p>No homes yet</p>
                    <p style="font-size: 14px; color: #999;">Click + to create your first home</p>
                </div>
            `;
            return;
        }

        homes.forEach(home => {
            homesGrid.innerHTML += `
                <div class="home-card" data-home-id="${home.id}">
                    <div class="home-name">${escapeHtml(home.name)}</div>
                    <div class="home-meta">
                        ${home.rooms_count || 0} rooms • ${home.devices_count || 0} devices
                    </div>
                </div>
            `;
        });

    } catch (e) {
        console.error(e);
        homesGrid.innerHTML = `
            <div class="empty-homes">
                <p>Failed to load homes</p>
                <p style="font-size: 14px; color: #999;">Please refresh the page</p>
            </div>
        `;
    }
}

// XSS protection
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}