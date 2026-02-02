import './timetable-view.js';

class TimetableApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.storageKey = 'timetable-items';
        this.themeStorageKey = 'app-theme';

        this.state = {
            items: this._loadState() || [
                { id: 1, name: '수면', start: 22 * 60, end: 6 * 60, color: '#2980B9', borderColor: '#2980B9', priority: 5 }, // 22:00 - 06:00
                { id: 2, name: '업무', start: 9 * 60, end: 18 * 60, color: '#C0392B', borderColor: '#C0392B', priority: 7 }, // 09:00 - 18:00
                { id: 3, name: '운동', start: 19 * 60 + 30, end: 20 * 60 + 30, color: '#27AE60', borderColor: '#27AE60', priority: 6 }, // 19:30 - 20:30
            ],
            isDarkTheme: this._loadThemePreference(),
            editingItemId: null,
            editingItem: null, // Store the item object being edited
        };
        
        // Apply initial theme to the body element
        if (this.state.isDarkTheme) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        this._render();
    }

    _minutesToHHMM(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        return `${hh}:${mm}`;
    }

    _loadState() {
        try {
            const items = localStorage.getItem(this.storageKey);
            return items ? JSON.parse(items) : null;
        } catch (e) {
            console.error('Failed to load state from localStorage', e);
            return null;
        }
    }

    _saveState() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state.items));
        } catch (e) {
            console.error('Failed to save state to localStorage', e);
        }
    }

    _loadThemePreference() {
        try {
            const theme = localStorage.getItem(this.themeStorageKey);
            return theme === 'dark'; // Returns true if dark, false if light or not set
        } catch (e) {
            console.error('Failed to load theme preference from localStorage', e);
            return false; // Default to light theme on error
        }
    }

    _saveThemePreference(isDark) {
        try {
            localStorage.setItem(this.themeStorageKey, isDark ? 'dark' : 'light');
        } catch (e) {
            console.error('Failed to save theme preference to localStorage', e);
        }
    }

    _toggleTheme() {
        this.state.isDarkTheme = !this.state.isDarkTheme;
        if (this.state.isDarkTheme) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        this._saveThemePreference(this.state.isDarkTheme);
        this._render(); // Re-render to update the toggle switch state
    }

    _HHMMToMinutes(hhmm) {
        if (!hhmm) return 0;
        const [hours, minutes] = hhmm.split(':').map(Number);
        return hours * 60 + minutes;
    }

    _snapToNearest30Minutes(totalMinutes) {
        const remainder = totalMinutes % 30;
        if (remainder === 0) {
            return totalMinutes;
        }
        // Round to nearest 30. If remainder >= 15, round up, otherwise round down.
        return (remainder >= 15) ? totalMinutes - remainder + 30 : totalMinutes - remainder;
    }

    _populateFormForEdit(item) {
        const form = this.shadowRoot.querySelector('#add-item-form');
        form.querySelector('#name').value = item.name;
        form.querySelector('#start').value = this._minutesToHHMM(item.start);
        form.querySelector('#end').value = this._minutesToHHMM(item.end);
        form.querySelector('#color').value = item.color;
        form.querySelector('#borderColor').value = item.borderColor;
        form.querySelector('#priority').value = item.priority || 5; // Default priority

        this.state.editingItemId = item.id;
        this.state.editingItem = item; // Store the item being edited
        this._render(); // Re-render to update button text and show cancel button
    }

    _cancelEdit() {
        this.state.editingItemId = null;
        this.state.editingItem = null;
        const form = this.shadowRoot.querySelector('#add-item-form');
        form.reset();
        this._render(); // Re-render to update button text and hide cancel button
    }

    _processOverlaps(items) {
        if (!items || items.length === 0) {
            return [];
        }

        const events = items.map(item => {
            // Handle overnight events by splitting them for processing
            if (item.start >= item.end) {
                return [
                    { ...item, start: item.start, end: 24 * 60, originalItemId: item.id },
                    { ...item, start: 0, end: item.end, originalItemId: item.id }
                ];
            }
            return [{ ...item, originalItemId: item.id }];
        }).flat();

        // Collect all unique time points (start and end of all events)
        const timePoints = new Set();
        events.forEach(event => {
            timePoints.add(event.start);
            timePoints.add(event.end);
        });
        const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);

        const processedSegments = [];

        // Iterate through each small interval defined by time points
        for (let i = 0; i < sortedTimePoints.length - 1; i++) {
            const intervalStart = sortedTimePoints[i];
            const intervalEnd = sortedTimePoints[i + 1];

            if (intervalStart === intervalEnd) continue; // Skip zero-length intervals

            // Find all active events within this interval
            const activeEvents = events.filter(event => {
                // Check if the event overlaps with the current interval
                // An event (eventStart, eventEnd) covers (intervalStart, intervalEnd) if:
                // eventStart <= intervalStart AND eventEnd >= intervalEnd
                // (Considering modulo 24*60 for wrapping overnight events if not already split)
                
                // For already split overnight events, event.end could be 24*60 or event.start could be 0.
                // Simple overlap check
                return (event.start < intervalEnd && event.end > intervalStart);
            });

            if (activeEvents.length > 0) {
                // Sort active events by priority (higher number = higher priority)
                activeEvents.sort((a, b) => (b.priority || 0) - (a.priority || 0));
                
                // The highest priority event dictates the color for this segment
                const highestPriorityEvent = activeEvents[0];

                processedSegments.push({
                    name: highestPriorityEvent.name,
                    start: intervalStart,
                    end: intervalEnd,
                    color: highestPriorityEvent.color,
                    borderColor: highestPriorityEvent.borderColor,
                    priority: highestPriorityEvent.priority,
                    originalItemId: highestPriorityEvent.originalItemId, // Keep track of the original item
                });
            }
        }
        return processedSegments;
    }

    _render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    gap: 2rem;
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 1rem;
                    align-items: flex-start;
                }

                #timetable-container {
                    flex: 1;
                    position: sticky;
                    top: 1rem;
                }

                #controls-container {
                    width: 350px;
                    padding: 1.5rem;
                    background-color: var(--color-surface);
                    border-radius: 12px;
                    border: 1px solid var(--color-border);
                    box-shadow: 0 8px 32px 0 var(--shadow-color);
                    transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
                }
                
                h2, h3 {
                    margin-top: 0;
                    color: var(--color-primary);
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 0.5rem;
                    margin-bottom: 1rem;
                    transition: border-color 0.3s ease;
                }

                h3 {
                    margin-top: 2rem;
                }

                form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .form-control {
                    display: flex;
                    flex-direction: column;
                    text-align: left;
                }

                label {
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--color-text-secondary);
                    transition: color 0.3s ease;
                }

                input[type="text"], input[type="time"], input[type="color"], input[type="number"] {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--color-border);
                    background-color: var(--color-background);
                    color: var(--color-text-primary);
                    border-radius: 6px;
                    font-size: 1rem;
                    transition: border-color 0.3s ease, background-color 0.3s ease, color 0.3s ease;
                }
                
                input[type="color"] {
                    padding: 0.25rem;
                    height: 48px;
                }

                button {
                    padding: 0.8rem 1.5rem;
                    border: none;
                    background-color: var(--color-accent);
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: bold;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px 0 var(--glow-color);
                }

                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px 0 var(--glow-color);
                }

                .button-group {
                    margin-top: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .secondary-btn {
                    background-color: transparent;
                    border: 1px solid var(--color-accent);
                    color: var(--color-accent);
                    box-shadow: none;
                }

                .secondary-btn:hover {
                    background-color: var(--color-accent);
                    color: white;
                    box-shadow: 0 4px 15px 0 var(--glow-color);
                }

                #item-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .item-list-entry {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background-color: var(--color-background);
                    border-radius: 6px;
                    transition: background-color 0.3s ease;
                }

                .item-list-entry .name {
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .item-list-entry .color-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    display: inline-block;
                }
                
                .item-list-entry .actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .edit-btn, .delete-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0.25rem;
                    box-shadow: none;
                    transition: transform 0.2s ease, color 0.2s ease;
                }

                .edit-btn {
                    color: var(--color-accent);
                }
                .edit-btn:hover {
                    color: var(--color-primary);
                    transform: scale(1.1);
                }

                .delete-btn {
                    color: #E74C3C;
                }
                .delete-btn:hover {
                    color: #C0392B;
                    transform: scale(1.1);
                }

                /* Theme Toggle Switch */
                .theme-toggle {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.5rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid var(--color-border);
                }

                .theme-switch {
                    position: relative;
                    display: inline-block;
                    width: 48px;
                    height: 24px;
                }

                .theme-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    -webkit-transition: .4s;
                    transition: .4s;
                    border-radius: 24px;
                }

                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    -webkit-transition: .4s;
                    transition: .4s;
                    border-radius: 50%;
                }

                input:checked + .slider {
                    background-color: var(--color-accent);
                }

                input:focus + .slider {
                    box-shadow: 0 0 1px var(--color-accent);
                }

                input:checked + .slider:before {
                    -webkit-transform: translateX(24px);
                    -ms-transform: translateX(24px);
                    transform: translateX(24px);
                }


                @media (max-width: 768px) {
                    :host {
                        flex-direction: column;
                        align-items: center;
                    }
                    #timetable-container {
                        position: static;
                        top: auto;
                    }
                    #controls-container {
                        width: 100%;
                        max-width: 400px;
                    }
                }
            </style>
            <div id="timetable-container">
                <circular-timetable items='${JSON.stringify(this._processOverlaps(this.state.items))}'></circular-timetable>
            </div>
            <div id="controls-container">
                <div class="theme-toggle">
                    <span>다크 모드</span>
                    <label class="theme-switch">
                        <input type="checkbox" id="dark-mode-toggle" ${this.state.isDarkTheme ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>

                <h2>활동 추가</h2>
                <form id="add-item-form">
                    <div class="form-control">
                        <label for="name">활동 이름</label>
                        <input type="text" id="name" name="name" required value="${this.state.editingItem?.name || ''}">
                    </div>
                    <div class="form-control">
                        <label for="start">시작 시간</label>
                        <input type="time" id="start" name="start" step="1800" required value="${this._minutesToHHMM(this.state.editingItem?.start ?? 0)}">
                    </div>
                    <div class="form-control">
                        <label for="end">종료 시간</label>
                        <input type="time" id="end" name="end" step="1800" required value="${this._minutesToHHMM(this.state.editingItem?.end ?? 0)}">
                    </div>
                    <div class="form-control">
                        <label for="color">내부 색상</label>
                        <input type="color" id="color" name="color" value="${this.state.editingItem?.color || '#3498DB'}">
                    </div>
                    <div class="form-control">
                        <label for="borderColor">테두리 색상</label>
                        <input type="color" id="borderColor" name="borderColor" value="${this.state.editingItem?.borderColor || '#21618C'}">
                    </div>
                    <div class="form-control">
                        <label for="priority">우선순위 (1-10, 높을수록 우선)</label>
                        <input type="number" id="priority" name="priority" min="1" max="10" value="${this.state.editingItem?.priority || 5}" required>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button type="submit">${this.state.editingItemId ? '수정' : '추가'}</button>
                        ${this.state.editingItemId ? '<button type="button" id="cancel-edit-btn" class="secondary-btn">취소</button>' : ''}
                    </div>
                </form>

                <div class="button-group">
                    <button id="export-png-btn" class="secondary-btn">PNG로 내보내기</button>
                </div>

                <h3>활동 목록</h3>
                <ul id="item-list">
                    ${this.state.items.map(item => `
                        <li class="item-list-entry">
                            <span class="name">
                                <span class="color-dot" style="background-color: ${item.color}; border: 1px solid ${item.borderColor};"></span>
                                ${item.name} (${this._minutesToHHMM(item.start)} - ${this._minutesToHHMM(item.end)}) [Prio: ${item.priority || 5}]
                            </span>
                            <div class="actions">
                                <button class="edit-btn" data-id="${item.id}" title="수정">✎</button>
                                <button class="delete-btn" data-id="${item.id}" title="삭제">✖</button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        this.shadowRoot.querySelector('#add-item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            
            let startMinutes = this._snapToNearest30Minutes(this._HHMMToMinutes(formData.get('start')));
            let endMinutes = this._snapToNearest30Minutes(this._HHMMToMinutes(formData.get('end')));

            // Handle full day event if start and end are the same (and not midnight itself)
            if (startMinutes === endMinutes && startMinutes !== 0) { 
                endMinutes = 24 * 60; // Represents a full 24-hour period
            }

            const newItemData = {
                id: this.state.editingItemId || Date.now(), // Use existing ID if editing, else new one
                name: formData.get('name'),
                start: startMinutes,
                end: endMinutes,
                color: formData.get('color'),
                borderColor: formData.get('borderColor'),
                priority: parseInt(formData.get('priority')) || 5 // Default priority
            };

            if (this.state.editingItemId) {
                // Editing existing item
                this.state.items = this.state.items.map(item =>
                    item.id === this.state.editingItemId ? newItemData : item
                );
                this.state.editingItemId = null; // Exit edit mode
                this.state.editingItem = null;
            } else {
                // Adding new item
                this.state.items = [...this.state.items, newItemData];
            }
            this._saveState();
            this._render();
            form.reset();
        });

        this.shadowRoot.querySelector('#item-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const itemId = parseInt(e.target.dataset.id);
                this.state.items = this.state.items.filter(item => item.id !== itemId);
                this._saveState();
                this._render();
                if (this.state.editingItemId === itemId) { // If deleting the item being edited
                    this._cancelEdit();
                }
            } else if (e.target.classList.contains('edit-btn')) {
                const itemId = parseInt(e.target.dataset.id);
                const itemToEdit = this.state.items.find(item => item.id === itemId);
                if (itemToEdit) {
                    this._populateFormForEdit(itemToEdit);
                }
            }
        });
        
        this.shadowRoot.querySelector('#export-png-btn').addEventListener('click', () => {
            this._exportAsPNG();
        });

        this.shadowRoot.querySelector('#dark-mode-toggle').addEventListener('change', () => {
            this._toggleTheme();
        });

        // Add listener for cancel edit button if present
        const cancelEditBtn = this.shadowRoot.querySelector('#cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => this._cancelEdit());
        }
    }

    async _exportAsPNG() {
        try {
            const timetableComponent = this.shadowRoot.querySelector('circular-timetable');
            const svgElement = timetableComponent.shadowRoot.querySelector('svg');
            const svgString = new XMLSerializer().serializeToString(svgElement);

            // Create a temporary canvas to render the SVG
            const canvas = document.createElement('canvas');
            canvas.width = svgElement.viewBox.baseVal.width;
            canvas.height = svgElement.viewBox.baseVal.height;
            const ctx = canvas.getContext('2d');
            
            // Use Canvg to render the SVG onto the canvas
            const v = await canvg.Canvg.fromString(ctx, svgString);
            await v.render();
            
            // Get data URL and trigger download
            const dataUrl = canvas.toDataURL('image/png');

            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = 'timetable.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

        } catch(e) {
            console.error('Failed to export as PNG', e);
            alert('이미지 내보내기에 실패했습니다.');
        }
    }
}

customElements.define('timetable-app', TimetableApp);
