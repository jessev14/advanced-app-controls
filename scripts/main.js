const moduleName = "advanced-app-controls";


Hooks.once("init", () => {
    game.settings.register(moduleName, "invertScrollDirection", {
        name: "Invert Scroll Direction",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register(moduleName, "closeActiveWindow", {
        name: "Esc Closes Active Window Only",
        scope: "client",
        config: true,
        type: Boolean,
        default: false
    });

    game.keybindings.register(moduleName, "closeActiveWindow", {
        name: "Close Active Window",
        uneditable: [
            {
                key: "Escape"
            }
        ],
        onDown: context => {
            if (!game.settings.get(moduleName, "closeActiveWindow")) return;

            // Save fog of war if there are pending changes
            if (canvas.ready) canvas.sight.commitFog();

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
        reservedModifiers: ["Shift"]
    });

    game.keybindings.register(moduleName, "switchWindow", {
        name: "Switch to Next Window",
        editable: [
            {
                key: "Tab",
                modifiers: ["Control"]
            }
        ],
        onDown: context => {
            const windows = Object.values(ui.windows).sort((a, b) => a.position.zIndex - b.position.zIndex);
            const topWindow = windows[windows.length - 1];
            let _maxZ = topWindow.position.zIndex;

            if (!context.isShift) {    
                for (const window of windows.slice(0, windows.length - 1)) {
                    ++_maxZ;
                    window.position.zIndex = _maxZ;
                    window.element[0].style.zIndex = window.position.zIndex;
                }
            } else {
                const bottomWindow = windows[0];
                ++_maxZ;
                bottomWindow.position.zIndex = _maxZ;
                bottomWindow.element[0].style.zIndex = _maxZ;
            }
        },
        reservedModifiers: ["Shift"]
    });

});

Hooks.once("ready", () => {
    document.addEventListener("auxclick", ev => {
        if (ev.button !== 1) return;

        const { target } = ev;
        if (!target.classList.contains("window-title")) return;

        ui.activeWindow.close();
    });
});


Hooks.on("renderApplication", implementScrollTab);
Hooks.on("renderActorSheet", implementScrollTab);
Hooks.on("renderItemSheet", implementScrollTab);
Hooks.on("renderSidebarTab", implementScrollTab);


function implementScrollTab(app, html, data) {
    const tabSelectors = html[0].querySelectorAll(`nav.tabs`);
    tabSelectors.forEach(n => {
        n.addEventListener("wheel", ev => {
            let { wheelDelta } = ev;
            if (game.settings.get(moduleName, "invertScrollDirection")) wheelDelta *= -1;
            const direction = wheelDelta < 0;
            const currentTab = n.querySelector(`a.active`);
            let targetTab;
            if (direction) targetTab = currentTab.nextElementSibling || n.querySelector(`a`);
            else targetTab = currentTab.previousElementSibling || n.lastElementChild;
            targetTab.click();
        });
    });
}
