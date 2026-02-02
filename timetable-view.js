class CircularTimetable extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._items = [];
        this.render();
    }

    static get observedAttributes() {
        return ['items'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'items') {
            this._items = JSON.parse(newValue);
            this.render();
        }
    }

    set items(value) {
        this._items = value;
        this.render();
    }

    get items() {
        return this._items;
    }

    render() {
        const size = 500;
        const center = size / 2;
        const radius = size / 2 - 40;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    max-width: ${size}px;
                    aspect-ratio: 1 / 1;
                    margin: auto;
                }
                svg {
                    width: 100%;
                    height: 100%;
                }
                .background-circle {
                    fill: var(--color-surface, #1E1E1E);
                    stroke: var(--color-border, #2D2D2D);
                    stroke-width: 1;
                }
                .hour-marker {
                    stroke: var(--color-border, #2D2D2D);
                    stroke-width: 1;
                }
                .hour-text {
                    fill: var(--color-text-secondary, #B0B0B0);
                    font-size: 14px;
                    text-anchor: middle;
                    dominant-baseline: middle;
                }
                .item-arc {
                    fill: none;
                    stroke-linecap: round;
                }
                .item-arc-path {
                    fill: none;
                }
                .item-text textPath {
                    fill: var(--color-text-primary, #FFF);
                    font-size: 14px;
                    font-weight: bold;
                }
            </style>
            <svg viewBox="0 0 ${size} ${size}" id="timetable-svg">
                <defs></defs>
                <circle class="background-circle" cx="${center}" cy="${center}" r="${radius}" />
                <g class="hour-markers">
                    ${this.renderHourMarkers(center, radius)}
                </g>
                <g class="schedule-items">
                    ${this.renderItems(center, radius)}
                </g>
            </svg>
        `;
    }

    renderHourMarkers(center, radius) {
        let markers = '';
        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * 360 - 90;
            const textRadius = radius + 20;
            const x1 = center + radius * Math.cos(angle * Math.PI / 180);
            const y1 = center + radius * Math.sin(angle * Math.PI / 180);
            const x2 = center + (radius - 10) * Math.cos(angle * Math.PI / 180);
            const y2 = center + (radius - 10) * Math.sin(angle * Math.PI / 180);
            const textX = center + textRadius * Math.cos(angle * Math.PI / 180);
            const textY = center + textRadius * Math.sin(angle * Math.PI / 180);

            if (i % 3 === 0) { // Only show labels for every 3 hours
                markers += `<text class="hour-text" x="${textX}" y="${textY}">${i}</text>`;
            }
            markers += `<line class="hour-marker" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
        }
        return markers;
    }

    renderItems(center, radius) {
        let itemElements = '';
        const defs = this.shadowRoot.querySelector('defs');
        if (defs) defs.innerHTML = ''; // Clear previous defs

        const arcWidth = 35;
        
        this._items.forEach((item, index) => {
            const itemRadius = radius - (index * (arcWidth + 8)) - (arcWidth / 2);
            
            if (item.start > item.end) { // Overnight event
                itemElements += this._createArc(item, item.start, 24, center, itemRadius, arcWidth, index, true);
                itemElements += this._createArc(item, 0, item.end, center, itemRadius, arcWidth, index, false);
            } else {
                itemElements += this._createArc(item, item.start, item.end, center, itemRadius, arcWidth, index, true);
            }
        });
        return itemElements;
    }

    _createArc(item, startHour, endHour, center, radius, width, index, showText) {
        const startAngle = (startHour / 24) * 360 - 90;
        const endAngle = (endHour / 24) * 360 - 90;
        
        // Path for the visible stroke
        const arcPath = this._describeArc(center, center, radius, startAngle, endAngle);
        // Path for the textPath (needs to be a separate path in defs)
        const textPathId = `text-path-${item.id}-${index}-${startHour}`;
        const textPathDef = this._describeArc(center, center, radius, startAngle, endAngle, true);

        const defs = this.shadowRoot.querySelector('defs');
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('id', textPathId);
        pathElement.setAttribute('d', textPathDef);
        defs.appendChild(pathElement);
        
        let textElement = '';
        if (showText) {
            textElement = `
                <text class="item-text" dy="-10">
                    <textPath href="#${textPathId}" startOffset="50%" text-anchor="middle">
                        ${item.name}
                    </textPath>
                </text>
            `;
        }

        return `
            <g>
                <path class="item-arc" d="${arcPath}" stroke="${item.color}" stroke-width="${width}" />
                ${textElement}
            </g>
        `;
    }

    _describeArc(x, y, radius, startAngle, endAngle, forTextPath = false) {
        // Ensure endAngle is greater than startAngle for arc calculation
        if (endAngle <= startAngle) {
            endAngle += 360;
        }
        
        const start = this.polarToCartesian(x, y, radius, endAngle);
        const end = this.polarToCartesian(x, y, radius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        
        // Sweep flag is different for text path to ensure text is upright
        const sweepFlag = forTextPath ? "1" : "0";

        const d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, sweepFlag, end.x, end.y
        ].join(" ");

        return d;
    }
    
    polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }
}

customElements.define('circular-timetable', CircularTimetable);
