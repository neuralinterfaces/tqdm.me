
const BARS = {} // Track progress bars
const CONTAINERS = {} // Track request containers

export const labelMap = {
    '::1': 'This Device',
}
  

export const mainContainer = document.querySelector('main');
export const progressContainer = document.getElementById('progress')
export const discoveryContainer = document.createElement('div');
discoveryContainer.id = 'discover';

// Create a progress bar and append it to the bar container
export const createProgressBar = (parentElement = progressContainer) => {

    const container = document.createElement('div');
    container.classList.add('bar');

    const row1 = document.createElement('div');
    const row2 = document.createElement('div');
    const row3 = document.createElement('div');

    const headerEl = document.createElement('label');
    row1.append(headerEl);

    const element = document.createElement('div');
    element.classList.add('progress');
    const progress = document.createElement('div');

    const readout = document.createElement('small');
    element.append(progress);

    row2.append(element, readout);

    const metadataEl = document.createElement('small');
    row3.append(metadataEl);

    container.append(row1, row2, row3);

    parentElement.appendChild(container); // Render the progress bar


    const update = ( { format, ...metadata } = {}) => {

        const { done, live = true } = metadata

        container.setAttribute('data-complete', done); // Add a complete style to the progress bar if it is complete
        container.setAttribute('data-live', live); // Add a live style to the progress bar if it is live
        
        // Catch pinged bars that did not have any updates...
        if (!format) {
            metadataEl.innerText = `This bar was not reached.`;
            return
        }

        const { total, n, elapsed, rate, prefix } = format;

        const cappedN = Math.min(n, total)
        
        const percent = 100 * ( n / total );
        progress.style.width = `${Math.min(100, percent)}%`

        readout.innerText = `${n} / ${total} (${percent.toFixed(1)}%)`;

        const remaining = rate && total ? (total - Math.min(n, total)) / rate : 0; // Seconds

        if (prefix) headerEl.innerText = prefix
        metadataEl.innerText = `${elapsed.toFixed(1)}s elapsed, ${remaining.toFixed(1)}s remaining`;
    }


    return {
        element,
        description: metadataEl,
        progress,
        readout,
        container,
        update
    };
}

const metadataOrder = [ 'user_id', 'parent', 'group' ]

// Create + render a progress bar
export function getBar ({ id, ...metadata }) {

    if (BARS[id]) return BARS[id];

    const container = getContainer(metadata)
    const bar = createProgressBar(container.bars);

    // const { container } = bar;
    // container.setAttribute('data-small', pid !== progress_bar_id); // Add a small style to the progress bar if it is not the main request bar

    return BARS[id] = bar;

}

function createContainer( identifier, label = identifier ) {

    label = labelMap[identifier] || label // Override label with ID default

    const container = document.createElement('div');
    container.id = identifier;
    container.classList.add('progress-container');

    const header = document.createElement('header');

    const firstHeaderContainer = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.innerText = label;

    const description = document.createElement('small');

    firstHeaderContainer.append(h2, description);
    header.append(firstHeaderContainer);

    const barsElement = document.createElement('div');
    barsElement.classList.add('bar-container');

    container.append(header, barsElement);

    return {
        header: h2,
        description,
        bars: barsElement,
        element: container,
        subcontainers: {}
    };

}


// KEEP A GLOBAL REGISTRY OF ALL GROUPS DESPITE NESTING
const CONTAINERMAP = {}

export function getContainer(metadata) {

    // Match parent to previous group
    const parentContainer = CONTAINERMAP[metadata.parent]

    if (parentContainer) return parentContainer

    let identifier;
    const container = metadataOrder.reduce((acc, key) => {
        const value = metadata[key]
        const parentEl = acc === CONTAINERS ? progressContainer : acc.element
        if (acc.subcontainers) acc = acc.subcontainers

        if (identifier) identifier += `/${value}`
        else identifier = value

        if (!acc[value]) {
            const info = acc[value] = createContainer(identifier, value)
            parentEl.append(info.element)
        }
        
        return acc[value]

    }, CONTAINERS)

    CONTAINERMAP[metadata.group] = container

    return container


}
