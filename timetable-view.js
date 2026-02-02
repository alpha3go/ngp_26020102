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
        // Radius of the outermost part of the timetable where the schedule items start.
        // The inner part will be used for central circle or inner details if any.
        const outerRadiusOfTimetable = size / 2 - 40;

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
                    fill: var(--color-surface);
                    stroke: var(--color-border);
                    stroke-width: 1;
                }
                .hour-marker {
                    stroke: var(--color-border);
                    stroke-width: 1;
                }
                .hour-text {
                    fill: var(--color-text-secondary);
                    font-size: 14px;
                    text-anchor: middle;
                    dominant-baseline: middle;
                }
                .item-sector {
                    transition: fill 0.3s ease, stroke 0.3s ease, transform 0.3s ease;
                    cursor: pointer;
                }
                .item-sector:hover {
                    transform: scale(1.01);
                    transform-origin: ${center}px ${center}px;
                    filter: brightness(1.1);
                }
                .item-text {
                    fill: var(--color-text-primary);
                    font-size: 12px;
                    font-weight: bold;
                    text-anchor: middle;
                    dominant-baseline: middle;
                    pointer-events: none; /* Make text not interfere with mouse events on the sector */
                }
            </style>
            <svg viewBox="0 0 ${size} ${size}" id="timetable-svg">
                <circle class="background-circle" cx="${center}" cy="${center}" r="${outerRadiusOfTimetable}" />
                <g class="schedule-items">
                    ${this.renderItems(center, outerRadiusOfTimetable)}
                </g>
                <g class="hour-markers">
                    ${this.renderHourMarkers(center, outerRadiusOfTimetable)}
                </g>
                <circle cx="${center}" cy="${center}" r="40" fill="var(--color-background)" />
                <text x="${center}" y="${center}" class="hour-text" fill="var(--color-text-primary)" style="font-size:18px;">24h</text>

            </svg>
        `;
    }

    renderHourMarkers(center, outerRadius) {
        let markers = '';
        const innerHourMarkerRadius = outerRadius; // Markers start at the outer edge of schedule items
        const outerHourMarkerRadius = outerRadius + 10; // Extend markers a bit outside
        const textRadius = outerRadius + 25; // Text slightly further out

        for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * 360 - 90; // -90 to start at 12 o'clock position (top)

            const x1 = center + innerHourMarkerRadius * Math.cos(angle * Math.PI / 180);
            const y1 = center + innerHourMarkerRadius * Math.sin(angle * Math.PI / 180);
            const x2 = center + outerHourMarkerRadius * Math.cos(angle * Math.PI / 180);
            const y2 = center + outerHourMarkerRadius * Math.sin(angle * Math.PI / 180);

            const textX = center + textRadius * Math.cos(angle * Math.PI / 180);
            const textY = center + textRadius * Math.sin(angle * Math.PI / 180);

            // Draw line markers
            markers += `<line class="hour-marker" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;

            // Draw hour text every 3 hours
            if (i % 3 === 0) {
                markers += `<text class="hour-text" x="${textX}" y="${textY}">${i}</text>`;
            }
        }
        return markers;
    }

    renderItems(center, outerRadiusOfTimetable) {
        let itemElements = '';
        const maxItems = 5; // Max number of concentric bands for schedule items
        const totalRingWidth = outerRadiusOfTimetable - 40; // Total width available for schedule items
        const bandWidth = totalRingWidth / maxItems; // Width of each band

        this._items.forEach((item, index) => {
            // Calculate radii for this item's band
            const outerBandRadius = outerRadiusOfTimetable - (bandWidth * index);
            const innerBandRadius = outerBandRadius - bandWidth;

            if (innerBandRadius <= 0) { // Avoid drawing items too close to center or overlapping
                console.warn(`Item ${item.name} (index ${index}) would be too small or overlap center. Skipping.`);
                return;
            }

            // Handle overnight events: split into two parts for rendering
            if (item.start > item.end) {
                // Part 1: from start to midnight (24:00)
                itemElements += this._createSector(
                    item.name, item.start, 24 * 60, item.color, item.borderColor,
                    center, innerBandRadius, outerBandRadius
                );
                // Part 2: from midnight (00:00) to end
                itemElements += this._createSector(
                    item.name, 0, item.end, item.color, item.borderColor,
                    center, innerBandRadius, outerBandRadius
                );
            } else {
                itemElements += this._createSector(
                    item.name, item.start, item.end, item.color, item.borderColor,
                    center, innerBandRadius, outerBandRadius
                );
            }
        });
        return itemElements;
    }

    _createSector(name, startMinutes, endMinutes, fillColor, strokeColor, center, innerRadius, outerRadius) {
        // Convert minutes to degrees (0-1440 minutes in 24 hours)
        const startAngle = (startMinutes / (24 * 60)) * 360 - 90; // -90 to start at 12 o'clock
        const endAngle = (endMinutes / (24 * 60)) * 360 - 90;

        const pathData = this._describeSector(center, center, innerRadius, outerRadius, startAngle, endAngle);

        // Calculate text position in the middle of the sector
        const midAngle = startAngle + (endAngle - startAngle) / 2;
        const textMidRadius = innerRadius + (outerRadius - innerRadius) / 2;
        const textPos = this.polarToCartesian(center, center, textMidRadius, midAngle);


        return `
            <g>
                <path class="item-sector" d="${pathData}" fill="${fillColor}" stroke="${strokeColor}" />
                <text class="item-text" x="${textPos.x}" y="${textPos.y}">${name}</text>
            </g>
        `;
    }

    _describeSector(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
        const startInner = this.polarToCartesian(centerX, centerY, innerRadius, endAngle); // SVG arc draws clockwise
        const endInner = this.polarToCartesian(centerX, centerY, innerRadius, startAngle);

        const startOuter = this.polarToCartesian(centerX, centerY, outerRadius, endAngle);
        const endOuter = this.polarToCartesian(centerX, centerY, outerRadius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"; // For inner arc

        const path = [
            "M", endInner.x, endInner.y, // Start at inner end point
            "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y, // Inner arc (clockwise)
            "L", startOuter.x, startOuter.y, // Line to outer start point
            "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y, // Outer arc (counter-clockwise)
            "Z" // Close path
        ].join(" ");

        return path;
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
