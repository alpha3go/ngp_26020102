class CircularTimetable extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._timeSlices = []; // Changed from _items
        this.render();
    }

    static get observedAttributes() {
        return ['timeSlices'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'timeSlices') {
            this._timeSlices = JSON.parse(newValue);
            this.render();
        }
    }

    set timeSlices(value) {
        this._timeSlices = value;
        this.render();
    }

    get timeSlices() {
        return this._timeSlices;
    }

    render() {
        const size = 500;
        const center = size / 2;
        const outerRadiusOfTimetable = size / 2 - 20; // Max radius for event sectors
        const minRadialRadius = 40; // Inner radius for the innermost event sector

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
                    ${this.renderItems(center, outerRadiusOfTimetable, minRadialRadius)}
                </g>
                <g class="hour-markers">
                    ${this.renderHourMarkers(center, outerRadiusOfTimetable)}
                </g>
                <circle cx="${center}" cy="${center}" r="${minRadialRadius}" fill="var(--color-background)" />
                <text x="${center}" y="${center}" class="hour-text" fill="var(--color-text-primary)" style="font-size:18px;">24h</text>

            </svg>
        `;
    }

    renderHourMarkers(center, outerRadiusOfTimetable) { // Changed radius to outerRadiusOfTimetable
        let markers = '';
        const innerHourMarkerRadius = outerRadiusOfTimetable;
        const outerHourMarkerRadius = outerRadiusOfTimetable + 10;
        const textRadius = outerRadiusOfTimetable + 25;

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

            if (i % 3 === 0) {
                markers += `<text class="hour-text" x="${textX}" y="${textY}">${i}</text>`;
            }
        }
        return markers;
    }


    renderItems(center, outerRadiusOfTimetable, minRadialRadius) { // Changed parameter name
        let itemElements = '';

        this._timeSlices.forEach(timeSlice => { // Changed from _items
            const { start, end, activeEvents } = timeSlice;

            if (activeEvents.length === 0) {
                return;
            }

            // Calculate total priority for this time slice
            const totalPriority = activeEvents.reduce((sum, event) => sum + (event.priority || 1), 0);
            const availableRadialSpace = outerRadiusOfTimetable - minRadialRadius;

            let currentRadialInner = minRadialRadius;

            activeEvents.forEach(event => {
                const priorityProportion = (event.priority || 1) / totalPriority;
                const radialThickness = priorityProportion * availableRadialSpace;

                const eventInnerRadius = currentRadialInner;
                const eventOuterRadius = currentRadialInner + radialThickness;

                // Ensure valid radii
                if (eventInnerRadius < minRadialRadius || eventOuterRadius > outerRadiusOfTimetable) {
                    console.warn(`Calculated radii out of bounds for event ${event.name}. Skipping.`);
                    return;
                }

                itemElements += this._createSector(
                    event.name, start, end, event.color, event.borderColor,
                    center, eventInnerRadius, eventOuterRadius
                );

                currentRadialInner = eventOuterRadius; // Update for the next event in this timeSlice
            });
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
        const textMidRadius = innerRadius + (outerRadius - innerRadius) / 2; // Middle of the radial layer
        const textPos = this.polarToCartesian(center, center, textMidRadius, midAngle);


        return `
            <g>
                <path class="item-sector" d="${pathData}" fill="${fillColor}" stroke="${strokeColor}" />
                <text class="item-text" x="${textPos.x}" y="${textPos.y}">${name}</text>
            </g>
        `;
    }

    _describeSector(centerX, centerY, innerRadius, outerRadius, startAngle, endAngle) {
        // Ensure angles are ordered correctly for SVG path commands
        let sAngle = startAngle;
        let eAngle = endAngle;

        // Handle full circle
        if (Math.abs(eAngle - sAngle) >= 360) {
            sAngle = 0;
            eAngle = 359.99; // Close to 360 but not exactly, to ensure arc is drawn
        }

        const startInner = this.polarToCartesian(centerX, centerY, innerRadius, eAngle); // SVG arc draws clockwise from end to start
        const endInner = this.polarToCartesian(centerX, centerY, innerRadius, sAngle);

        const startOuter = this.polarToCartesian(centerX, centerY, outerRadius, eAngle);
        const endOuter = this.polarToCartesian(centerX, centerY, outerRadius, sAngle);

        const largeArcFlag = Math.abs(eAngle - sAngle) > 180 ? "1" : "0";

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
    }}

customElements.define('circular-timetable', CircularTimetable);
