document.addEventListener('DOMContentLoaded', () => {
    // --- AI Loader Logic ---
    const generateForm = document.querySelector('.professional-form form');
    const aiLoader = document.getElementById('aiLoader');
    const loadingStatus = document.getElementById('loadingStatus');

    if (generateForm) {
        generateForm.addEventListener('submit', () => {
            aiLoader.style.display = 'flex';

            const statuses = [
                "Analyzing your skill profile...",
                "Calculating tech stacks...",
                "Scanning global course catalogs...",
                "Identifying industry skill gaps...",
                "Optimizing learning sequence...",
                "Generating personalized roadmap..."
            ];

            let statusIndex = 0;
            setInterval(() => {
                statusIndex = (statusIndex + 1) % statuses.length;
                loadingStatus.style.opacity = 0;
                setTimeout(() => {
                    loadingStatus.innerText = statuses[statusIndex];
                    loadingStatus.style.opacity = 1;
                }, 300);
            }, 3000);
        });
    }

    // Manage localStorage for Saved Courses (Local fallback / guest mode)
    const getSavedFromLocal = () => {
        const stored = localStorage.getItem('savedCourses');
        return stored ? JSON.parse(stored) : [];
    };

    const saveToLocal = (courses) => {
        localStorage.setItem('savedCourses', JSON.stringify(courses));
    };

    // UI Handle Add/Remove
    const saveButtons = document.querySelectorAll('.save-course-btn');

    // Initial Load - Set active state on buttons from local storage
    const localSaved = getSavedFromLocal();
    saveButtons.forEach(btn => {
        const courseId = btn.dataset.id;
        if (localSaved.find(c => c.id === courseId)) {
            btn.classList.add('saved');
            btn.innerHTML = '<i class="fas fa-heart"></i> Saved';
        }
    });

    // Handle clicks on Save Buttons
    saveButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const courseData = {
                id: btn.dataset.id,
                title: btn.dataset.title,
                provider: btn.dataset.provider,
                url: btn.dataset.url
            };

            // 1. Sync with Database if Logged In
            try {
                const response = await fetch('/api/save-course', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(courseData)
                });

                if (response.status === 401) {
                    console.log("Guest mode: Saving to local storage only");
                }
            } catch (err) {
                console.warn("DB Save failed, falling back to local storage");
            }

            // 2. Local Storage Sync
            let courses = getSavedFromLocal();
            const existingIndex = courses.findIndex(c => c.id === courseData.id);

            if (existingIndex > -1) {
                courses.splice(existingIndex, 1);
                btn.classList.remove('saved');
                btn.innerHTML = '<i class="far fa-heart"></i> Save';
            } else {
                courses.push(courseData);
                btn.classList.add('saved');
                btn.innerHTML = '<i class="fas fa-heart"></i> Saved';
            }
            saveToLocal(courses);
        });
    });

    // Modal Logic
    const modal = document.getElementById('savedCoursesModal');
    const btnModalOpen = document.getElementById('savedCoursesBtn');
    const btnModalClose = document.querySelector('.close-btn');

    if (btnModalOpen) {
        btnModalOpen.onclick = function (e) {
            e.preventDefault();
            renderSavedCoursesModal();
            modal.style.display = 'block';
        }
    }

    if (btnModalClose) {
        btnModalClose.onclick = function () {
            modal.style.display = 'none';
        }
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    const renderSavedCoursesModal = () => {
        const listContainer = document.getElementById('savedCoursesList');
        const courses = getSavedFromLocal();

        if (courses.length === 0) {
            listContainer.innerHTML = '<p>You haven\'t saved any courses yet.</p>';
            return;
        }

        let html = '';
        courses.forEach(c => {
            html += `
                <div class="saved-course-item" id="saved-item-${c.id}">
                    <div class="saved-course-info">
                        <h4><a href="${c.url}" target="_blank">${c.title}</a></h4>
                        <p>${c.provider}</p>
                    </div>
                    <button class="remove-course" onclick="removeSavedCourse('${c.id}')"><i class="fas fa-trash"></i></button>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    };

    window.removeSavedCourse = function (id) {
        let courses = getSavedFromLocal();
        courses = courses.filter(c => c.id !== id);
        saveToLocal(courses);

        const item = document.getElementById(`saved-item-${id}`);
        if (item) item.remove();

        if (courses.length === 0) {
            document.getElementById('savedCoursesList').innerHTML = '<p>You haven\'t saved any courses yet.</p>';
        }

        const btn = document.querySelector(`.save-course-btn[data-id="${id}"]`);
        if (btn) {
            btn.classList.remove('saved');
            btn.innerHTML = '<i class="far fa-heart"></i> Save';
        }
    };
});
