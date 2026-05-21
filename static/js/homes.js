const HOME_STATS_URL = "/home/api/homes/stats/";

document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById("sidebar");
    const burger = document.getElementById("burger");

    if (burger && sidebar) {
        burger.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

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

        if (!homes.length) {
            homesGrid.innerHTML = `
                <div class="empty-homes">
                    <div class="empty-title">No homes yet</div>
                    <div class="empty-subtitle">Create your first smart home</div>
                </div>
            `;
            return;
        }

        homes.forEach(home => {
            homesGrid.innerHTML += `
                <div class="home-card">
                    <div class="home-name">${home.name}</div>
                    <div class="home-meta">
                        ${home.rooms_count} rooms • ${home.devices_count} devices
                    </div>
                </div>
            `;
        });

    } catch (e) {
        console.error(e);

        homesGrid.innerHTML = `
            <div class="empty-homes">
                <div class="empty-title">Error</div>
                <div class="empty-subtitle">Failed to load homes</div>
            </div>
        `;
    }
}