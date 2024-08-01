import { Plugin } from 'obsidian';

export default class CanvasFloatPlugin extends Plugin {
  private floatingElement: HTMLElement | null = null;
  private originalElement: HTMLElement | null = null;
  private isResizing = false;
  private resizeDirection: string | null = null;
  private aspectRatio: number = 9.0 / 16.0; // Default aspect ratio

  async onload() {
    console.log('Loading Canvas Float Plugin');

    this.addCommand({
      id: 'float-selected-element',
      name: 'Float selected element',
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
    const activeLeaf = this.app.workspace.activeLeaf;
    if (activeLeaf && activeLeaf.view.containerEl) {
      return activeLeaf.view.containerEl.querySelector('.canvas');
    }
    return null;
  }

  floatSelectedElement(canvas: HTMLElement) {
    const selectedElement = this.getSelectedElement(canvas)?.parentElement;
    
    if (selectedElement) {
      const originalRect = selectedElement.getBoundingClientRect();
      this.aspectRatio = originalRect.width / originalRect.height;
      this.createFloatingElement(selectedElement);
      this.replaceOriginalElement(selectedElement);
    }
  }

  getSelectedElement(canvas: HTMLElement): HTMLElement | null {
    return canvas.querySelector('.canvas-node.is-focused .canvas-node-content');
  }

  replaceOriginalElement(element: HTMLElement) {
    element.dataset.originalContent = element.children.toString();

    const newElement = document.createElement('div');
    newElement.classList.add('canvas-pip-restore-message');
    const message = document.createElement('p');
    message.textContent = 'Element is in picture-in-picture mode.';
    const button = document.createElement('button');
    button.classList.add('restore-btn');
    button.textContent = 'Restore';
    newElement.appendChild(message);
    newElement.appendChild(button);

    element.empty();
    element.appendChild(newElement);

    const restoreBtn = element.querySelector('.restore-btn') as HTMLButtonElement;
    restoreBtn.onclick = () => {
      this.restoreElementBack(element);
    };
  }

  restoreElement(floatingContainer: HTMLElement, originalElement: HTMLElement) {
    originalElement.empty();
    originalElement.appendChild(floatingContainer.children[0].children[0].cloneNode(true));
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
    if (this.floatingElement && this.originalElement) {
      this.restoreElement(this.floatingElement, this.originalElement);
    }

    const floatingContainer = document.createElement('div');
    floatingContainer.classList.add('floating-container');
    
    floatingContainer.appendChild(element.cloneNode(true));

    document.body.appendChild(floatingContainer);

    this.applyFloatingStyles(floatingContainer);

    const restoreButton = document.createElement('button');
    restoreButton.innerText = 'Restore';
    restoreButton.onclick = () => {
      this.restoreElement(floatingContainer, element);
    };
    floatingContainer.appendChild(restoreButton);

    this.floatingElement = floatingContainer;
    this.originalElement = element;

    this.addResizeHandlers(floatingContainer);
  }

  applyFloatingStyles(container: HTMLElement) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let width = windowWidth * 0.4; // Set width to 40% of window width
    let height = width / this.aspectRatio;
    if (height > windowHeight * 0.5) {
      // If height is greater than 80% of window height, set height to 80% of window height
      height = windowHeight * 0.5;
      width = height * this.aspectRatio;
    }
    container.style.setProperty('--width', `${width}px`)
    container.style.setProperty('--height', `${height}px`)
  }

  addResizeHandlers(container: HTMLElement) {
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const isResizingRight = e.clientX > rect.right - 10 && e.clientX < rect.right;
      const isResizingTop = e.clientY < rect.top + 10 && e.clientY > rect.top;
      const isResizingCorner = e.clientX > rect.right - 10 && e.clientY < rect.top + 10;

      if (isResizingCorner) {
        container.dataset.resizeDirection = 'corner';
      } else if (isResizingRight) {
        container.dataset.resizeDirection = 'right';
      } else if (isResizingTop) {
        container.dataset.resizeDirection = 'top';
      } else {
        container.dataset.resizeDirection = '';
      }
    });

    container.addEventListener('mouseleave', () => { container.dataset.resizeDirection = '' });

    container.addEventListener('mousedown', (e) => {
      const rect = container.getBoundingClientRect();
      if (e.clientX > rect.right - 10 && e.clientX < rect.right && e.clientY < rect.top + 10 && e.clientY > rect.top) {
        this.isResizing = true;
        this.resizeDirection = 'corner';
        this.floatingElement?.classList.add('resizing')
        e.preventDefault()
      } else if (e.clientX > rect.right - 10 && e.clientX < rect.right) {
        this.isResizing = true;
        this.resizeDirection = 'right';
        this.floatingElement?.classList.add('resizing')
        e.preventDefault()
      } else if (e.clientY < rect.top + 10 && e.clientY > rect.top) {
        this.isResizing = true;
        this.resizeDirection = 'top';
        this.floatingElement?.classList.add('resizing')
        e.preventDefault()
      }
    });

    document.addEventListener('mousemove', this.resizeElement.bind(this));
    document.addEventListener('mouseup', this.stopResizing.bind(this));
  }

  resizeElement(e: MouseEvent) {
    if (!this.isResizing || !this.floatingElement) return;
    e.preventDefault();

    const rect = this.floatingElement.getBoundingClientRect();
    if (this.resizeDirection === 'corner') {
      this.floatingElement.style.setProperty('--width', `${e.clientX - rect.left}px`);
      this.floatingElement.style.setProperty('--height', `${rect.bottom - e.clientY}px`);
    } else if (this.resizeDirection === 'right') {
      this.floatingElement.style.setProperty('--width', `${e.clientX - rect.left}px`);
    } else if (this.resizeDirection === 'top') {
      this.floatingElement.style.setProperty('--height', `${rect.bottom - e.clientY}px`);
    }
  }

  stopResizing(e: MouseEvent) {
    this.isResizing = false;
    this.resizeDirection = null;
    this.floatingElement?.classList.remove('resizing')
    e.preventDefault()
  }

  handleLayoutChange() {
    if (this.floatingElement && this.originalElement) {
      const canvas = this.getActiveCanvas();
      if (!canvas || !canvas.contains(this.originalElement)) {
        this.restoreElement(this.floatingElement, this.originalElement);
      }
    }
  }

  onunload() {
    console.log('Unloading Canvas Float Plugin');
  }
}
