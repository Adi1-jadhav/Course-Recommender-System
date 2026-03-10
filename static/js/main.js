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

    // --- Workspace Activity Tracking ---
    window.toggleCourseStatus = async (btn, id) => {
        const isCompleted = btn.classList.contains('active');
        const newStatus = isCompleted ? 'pending' : 'completed';
        const card = document.getElementById(`course-card-${id}`);

        try {
            const response = await fetch('/api/update-course-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status: newStatus })
            });

            if (response.ok) {
                btn.classList.toggle('active');
                card.classList.toggle('status-completed');

                // Update icon
                const icon = card.querySelector('.card-img-placeholder i');
                icon.className = `fas ${newStatus === 'completed' ? 'fa-check-circle' : 'fa-laptop-code'}`;

                updateProgressDisplay();
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // Auto-save notes logic with debounce
    let notesTimeout;
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('course-notes-area')) {
            clearTimeout(notesTimeout);
            const textarea = e.target;
            const id = textarea.dataset.id;
            const feedback = document.getElementById(`feedback-${id}`);

            notesTimeout = setTimeout(async () => {
                try {
                    await fetch('/api/save-notes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: id, notes: textarea.value })
                    });

                    // Show subtle feedback
                    feedback.style.display = 'block';
                    setTimeout(() => feedback.style.display = 'none', 2000);
                } catch (err) {
                    console.error('Notes sync failed');
                }
            }, 800);
        }
    });

    function updateProgressDisplay() {
        const totalCourses = document.querySelectorAll('.profile-course-card').length;
        const completedCourses = document.querySelectorAll('.profile-course-card.status-completed').length;

        const progressPercent = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;

        const bar = document.getElementById('overallProgress');
        const text = document.getElementById('progressText');
        const count = document.getElementById('completedCount');

        if (bar) bar.style.width = `${progressPercent}%`;
        if (text) text.innerText = `${progressPercent}%`;
        if (count) count.innerText = completedCourses;
    }

    // Initial progress setup
    updateProgressDisplay();

    // --- Course Detail Modal Logic ---
    const courseModal = document.getElementById('courseModal');
    const courseDetailsBody = document.getElementById('courseDetailsBody');
    const closeDetailBtn = document.querySelector('.close-detail-btn');

    // Delegate clicks for 'View Details'
    document.addEventListener('click', (e) => {
        if (e.target.closest('.view-details-btn')) {
            const btn = e.target.closest('.view-details-btn');
            const courseData = {
                title: btn.dataset.title,
                provider: btn.dataset.provider,
                desc: btn.dataset.desc,
                rating: btn.dataset.rating,
                duration: btn.dataset.duration,
                url: btn.dataset.url,
                img: btn.dataset.img
            };

            courseDetailsBody.innerHTML = `
                <div class="modal-course-header">
                    <img src="${courseData.img}" class="modal-hero-img">
                    <div class="modal-header-info">
                        <h2>${courseData.title}</h2>
                        <span class="badge badge-provider">${courseData.provider}</span>
                        <div class="modal-stats">
                            <span><i class="fas fa-star"></i> ${courseData.rating}</span>
                            <span><i class="fas fa-clock"></i> ${courseData.duration}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-body-content">
                    <h3>Course Overview</h3>
                    <p>${courseData.desc}</p>
                    <div class="curriculum-preview">
                        <h4>What you'll learn:</h4>
                        <ul>
                            <li>Industry Standard Practices</li>
                            <li>Hands-on Project Portfolio</li>
                            <li>Professional Interview Prep</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <a href="${courseData.url}" target="_blank" class="btn-primary w-100">Go to Original Site <i class="fas fa-external-link-alt"></i></a>
                </div>
            `;
            courseModal.style.display = 'block';
        }
    });

    if (closeDetailBtn) {
        closeDetailBtn.onclick = () => courseModal.style.display = 'none';
    }

    if (courseModal) {
        window.addEventListener('click', (event) => {
            if (event.target == courseModal) {
                courseModal.style.display = 'none';
            }
        });
    }

    window.removeSavedCourse = function (id, fromProfile = false) {
        let courses = getSavedFromLocal();
        courses = courses.filter(c => c.id !== id);
        saveToLocal(courses);

        if (fromProfile) {
            const item = document.getElementById(`course-card-${id}`);
            if (item) item.remove();
            updateProgressDisplay();
        } else {
            const item = document.getElementById(`saved-item-${id}`);
            if (item) item.remove();
        }

        if (courses.length === 0 && !fromProfile) {
            document.getElementById('savedCoursesList').innerHTML = '<p>You haven\'t saved any courses yet.</p>';
        }

        const btn = document.querySelector(`.save-course-btn[data-id="${id}"]`);
        if (btn) {
            btn.classList.remove('saved');
            btn.innerHTML = '<i class="far fa-heart"></i> Bookmark';
        }
    };
});
