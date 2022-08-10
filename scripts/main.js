const moduleName = 'advanced-app-controls';


Hooks.once('init', () => {
    game.settings.register(moduleName, 'invertScrollDirection', {
        name: 'Invert Scroll Direction',
        scope: 'client',
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(moduleName, 'closeActiveWindow', {
        name: 'Esc Closes Active Window Only',
        scope: 'client',
        config: true,
        type: Boolean,
        default: false
    });

    game.keybindings.register(moduleName, 'closeActiveWindow', {
        name: 'Close Active Window',
        hint: 'Enable in Module Settings. Hold Shift to close all windows.',
        uneditable: [
            {
                key: 'Escape'
            }
        ],
        onDown: context => {
            if (!game.settings.get(moduleName, 'closeActiveWindow')) return;

            // Save fog of war if there are pending changes
            if (canvas.ready) canvas.fog.commit();

            if (context.isShift) {
                Object.values(ui.windows).forEach(app => app.close());
                return true;
            }

            // Case 1 - dismiss an open context menu
            if (ui.context && ui.context.menu.length) {
                ui.context.close();
                return true;
            }

            if (ui.activeWindow?._state > 0) {
                ui.activeWindow.close();
                return true;
            }

            const windows = Object.values(ui.windows);
            if (windows.length) {
                const highestZApp = windows.reduce((acc, current) => acc.position.zIndex > current.position.zIndex ? acc : current);
                highestZApp.close();
                return true;
            }
        },
        reservedModifiers: ['Shift']
    });
});

Hooks.once('ready', () => {
    document.addEventListener('auxclick', ev => {
        console.log(ev)
        if (ev.button !== 1) return;

        const { target } = ev;
        if (!target.classList.contains('window-title')) return;

        ui.activeWindow.close();
    });
});


Hooks.on('renderApplication', implementScrollTab);
Hooks.on('renderActorSheet', implementScrollTab);
Hooks.on('renderItemSheet', implementScrollTab);
Hooks.on('renderSidebarTab', implementScrollTab);


function implementScrollTab(app, html, data) {
    const tabSelectors = html[0].querySelectorAll(`nav.tabs`);
    tabSelectors.forEach(n => {
        n.addEventListener('wheel', ev => {
            let { wheelDelta } = ev;
            if (game.settings.get(moduleName, 'invertScrollDirection')) wheelDelta *= -1;
            const direction = wheelDelta < 0;
            const currentTab = n.querySelector(`a.active`);
            let targetTab;
            if (direction) targetTab = currentTab.nextElementSibling || n.querySelector(`a`);
            else targetTab = currentTab.previousElementSibling || n.lastElementChild;
            targetTab.click();
        });
    });
}
