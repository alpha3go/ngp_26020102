import './timetable-view.js';

class TimetableApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.storageKey = 'timetable-items';
        this.state = {
            items: this._loadState() || [
                { id: 1, name: '수면', start: 22, end: 6, color: '#2980B9' },
                { id: 2, name: '업무', start: 9, end: 18, color: '#C0392B' },
                { id: 3, name: '운동', start: 19, end: 20, color: '#27AE60' },
            ]
        };
        this._render();
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
                    background-color: var(--color-surface, #333);
                    border-radius: 12px;
                    border: 1px solid var(--color-border, #444);
                    box-shadow: 0 8px 32px 0 var(--shadow-color);
                }
                
                h2, h3 {
                    margin-top: 0;
                    color: var(--color-primary);
                    border-bottom: 1px solid var(--color-border);
                    padding-bottom: 0.5rem;
                    margin-bottom: 1rem;
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
                }

                input[type="text"], input[type="time"], input[type="color"] {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--color-border);
                    background-color: var(--color-background);
                    color: var(--color-text-primary);
                    border-radius: 6px;
                    font-size: 1rem;
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

                .delete-btn {
                    background: none;
                    border: none;
                    color: #E74C3C;
                    cursor: pointer;
                    font-size: 1.2rem;
                    padding: 0.25rem;
                    box-shadow: none;
                }
                .delete-btn:hover {
                    color: #C0392B;
                    transform: scale(1.1);
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
                <circular-timetable items='${JSON.stringify(this.state.items)}'></circular-timetable>
            </div>
            <div id="controls-container">
                <h2>활동 추가</h2>
                <form id="add-item-form">
                    <div class="form-control">
                        <label for="name">활동 이름</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-control">
                        <label for="start">시작 시간</label>
                        <input type="time" id="start" name="start" step="3600" required>
                    </div>
                    <div class="form-control">
                        <label for="end">종료 시간</label>
                        <input type="time" id="end" name="end" step="3600" required>
                    </div>
                    <div class="form-control">
                        <label for="color">색상</label>
                        <input type="color" id="color" name="color" value="#3498DB">
                    </div>
                    <button type="submit">추가</button>
                </form>

                <div class="button-group">
                    <button id="export-png-btn" class="secondary-btn">PNG로 내보내기</button>
                </div>

                <h3>활동 목록</h3>
                <ul id="item-list">
                    ${this.state.items.map(item => `
                        <li class="item-list-entry">
                            <span class="name">
                                <span class="color-dot" style="background-color: ${item.color}"></span>
                                ${item.name} (${item.start}:00 - ${item.end}:00)
                            </span>
                            <button class="delete-btn" data-id="${item.id}" title="삭제">✖</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        this.shadowRoot.querySelector('#add-item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const form = e.target;
            const formData = new FormData(form);
            const startHour = parseInt(formData.get('start').split(':')[0]);
            const endHour = parseInt(formData.get('end').split(':')[0]);

            const newItem = {
                id: Date.now(),
                name: formData.get('name'),
                start: startHour,
                end: endHour,
                color: formData.get('color'),
            };

            this.state.items = [...this.state.items, newItem];
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
            }
        });
        
        this.shadowRoot.querySelector('#export-png-btn').addEventListener('click', () => {
            this._exportAsPNG();
        });
    }

    async _exportAsPNG() {
        try {
            const timetableComponent = this.shadowRoot.querySelector('circular-timetable');
            const svgElement = timetableComponent.shadowRoot.querySelector('svg');
            const svgString = new XMLSerializer().serializeToString(svgElement);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const v = await canvg.Canvg.fromString(ctx, svgString);
            await v.render();
            
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
