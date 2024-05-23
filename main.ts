import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

export default class CanvasFloatPlugin extends Plugin {
	private floatingElement: HTMLElement | null = null;
  private originalElement: HTMLElement | null = null;
  async onload() {
    console.log('Loading Canvas Float Plugin');

    this.addCommand({
      id: 'float-selected-element',
      name: 'Float Selected Element',
      checkCallback: (checking: boolean) => {
        const canvas = this.getActiveCanvas();
        if (canvas) {
          if (!checking) {
            this.floatSelectedElement(canvas);
          }
          return true;
        }
        return false;
      }
    });
	this.app.workspace.on('layout-change', () => this.handleLayoutChange());
  }

  getActiveCanvas(): HTMLElement | null {
    // Logic to get the currently active canvas element
    // This might vary depending on how Obsidian handles canvas internally
    // Placeholder logic:
    const activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf && activeLeaf.view.containerEl) {
      return activeLeaf.view.containerEl.querySelector('.canvas');
    }
    return null;
  }

  floatSelectedElement(canvas: HTMLElement) {
    const selectedElement = this.getSelectedElement(canvas)?.parentElement;
    if (selectedElement) {
      this.createFloatingElement(selectedElement);
      this.replaceOriginalElement(selectedElement);
    }
  }

  getSelectedElement(canvas: HTMLElement): HTMLElement | null {
    // Logic to get the currently selected element on the canvas
    // Placeholder logic:
    return canvas.querySelector('.canvas-node.is-focused .canvas-node-content');
  }


  replaceOriginalElement(element: HTMLElement) {
    element.dataset.originalContent = element.innerHTML;
    element.innerHTML = '<div class="canvas-pip-restore-message"><p>Element is in Picture-in-Picture mode.</p><button class="restore-btn">Restore</button></div>';

    // Add event listener to the restore button in the original element
    const restoreBtn = element.querySelector('.restore-btn') as HTMLButtonElement;
    restoreBtn.onclick = () => {
      this.restoreElementBack(element);
    };
  }

  restoreElement(floatingContainer: HTMLElement, originalElement: HTMLElement) {
    const originalContent = originalElement.dataset.originalContent;
    if (originalContent) {
      originalElement.innerHTML = originalContent;
    }
    document.body.removeChild(floatingContainer);
	this.floatingElement = null;
    this.originalElement = null;
  }

  restoreElementBack(element: HTMLElement) {
    const floatingContainer = document.querySelector('.floating-container');
    if (floatingContainer) {
      this.restoreElement(floatingContainer as HTMLElement, element);
    }
  }

  createFloatingElement(element: HTMLElement) {
	if (this.floatingElement) {
		// Restore previous floating element if any
		this.restoreElement(this.floatingElement, this.originalElement!);
	}
    const floatingContainer = document.createElement('div');
    floatingContainer.classList.add('floating-container');
    floatingContainer.appendChild(element.cloneNode(true));
    
    document.body.appendChild(floatingContainer);
    
    this.applyFloatingStyles(floatingContainer);

	// Add restore button
    const restoreButton = document.createElement('button');
    restoreButton.innerText = 'Restore';
    restoreButton.onclick = () => {
      this.restoreElement(floatingContainer, element);
    };
    floatingContainer.appendChild(restoreButton);
	this.floatingElement = floatingContainer;
    this.originalElement = element;
  }

  applyFloatingStyles(container: HTMLElement) {
    container.style.position = 'fixed';
    container.style.left = '10px';
    container.style.bottom = '10px';
    container.style.width = '640px';
    container.style.height = '380px';
    container.style.backgroundColor = 'white';
    container.style.border = '1px solid black';
    container.style.zIndex = '1000';
    container.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    container.style.overflow = 'auto';
  }

  onunload() {
    console.log('Unloading Canvas Float Plugin');
  }

  handleLayoutChange() {
    if (this.floatingElement && this.originalElement) {
      const canvas = this.getActiveCanvas();
      if (!canvas || !canvas.contains(this.originalElement)) {
        this.restoreElement(this.floatingElement, this.originalElement);
      }
    }
  }
}