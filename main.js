class TimetableApp extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    render() {
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
                    /* Placeholder for the circle */
                    aspect-ratio: 1 / 1;
                    border: 2px dashed var(--color-border, #444);
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    font-size: 1.5rem;
                    color: var(--color-text-secondary, #888);
                }

                #controls-container {
                    width: 300px;
                    padding: 1.5rem;
                    background-color: var(--color-surface, #333);
                    border-radius: 12px;
                    border: 1px solid var(--color-border, #444);
                }

                @media (max-width: 768px) {
                    :host {
                        flex-direction: column;
                        align-items: center;
                    }
                    #controls-container {
                        width: 100%;
                        max-width: 400px;
                    }
                }
            </style>
            <div id="timetable-container">
                <span>시간표</span>
            </div>
            <div id="controls-container">
                <h2>활동 추가</h2>
                <!-- Form will go here -->
            </div>
        `;
    }
}

customElements.define('timetable-app', TimetableApp);
