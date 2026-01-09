import React from 'react';

import cx from 'classnames';
import { createPortal } from 'react-dom';

import AbstractMenu from './AbstractMenu';
import { hideMenu } from './actions';
import listener from './globalEventListener';
import { callIfExists, cssClasses, store } from './helpers';
import SubMenu from './SubMenu';

export default class ContextMenu extends AbstractMenu {
  static defaultProps = {
    className: '',
    data: {},
    hideOnLeave: false,
    onHide(): void {
      return null;
    },
    onMouseLeave(): void {
      return null;
    },
    onShow(): void {
      return null;
    },
    preventHideOnContextMenu: false,
    preventHideOnResize: false,
    preventHideOnScroll: false,
    rtl: false,
    style: {},
  };

  private listenId: string;

  private menu: HTMLElement;

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      isVisible: false,
      x: 0,
      y: 0,
    };
  }

  getSubMenuType = () => SubMenu;

  componentDidMount(): void {
    this.listenId = listener.register(this.handleShow, this.handleHide);
  }

  componentDidUpdate(): void {
    const wrapper = window.requestAnimationFrame || setTimeout;

    if (this.state.isVisible) {
      wrapper(() => {
        const { x, y } = this.state;

        const { left, top } = this.props.rtl ? this.getRTLMenuPosition(x, y) : this.getMenuPosition(x, y);

        wrapper(() => {
          if (!this.menu) {
            return;
          }

          this.menu.style.top = `${top}px`;
          this.menu.style.left = `${left}px`;
          this.menu.style.opacity = '1';
          this.menu.style.pointerEvents = 'auto';
        });
      });
    } else {
      wrapper(() => {
        if (!this.menu) {
          return;
        }

        this.menu.style.opacity = '0';
        this.menu.style.pointerEvents = 'none';
      });
    }
  }

  componentWillUnmount(): void {
    if (this.listenId) {
      listener.unregister(this.listenId);
    }

    this.unregisterHandlers();
  }

  registerHandlers = (): void => {
    document.addEventListener('mousedown', this.handleOutsideClick);
    document.addEventListener('touchstart', this.handleOutsideClick);

    if (!this.props.preventHideOnScroll) {
      document.addEventListener('scroll', this.handleHide);
    }

    if (!this.props.preventHideOnContextMenu) {
      document.addEventListener('contextmenu', this.handleHide);
    }

    document.addEventListener('keydown', this.handleKeyNavigation);

    if (!this.props.preventHideOnResize) {
      window.addEventListener('resize', this.handleHide);
    }
  };

  unregisterHandlers = (): void => {
    document.removeEventListener('mousedown', this.handleOutsideClick);
    document.removeEventListener('touchstart', this.handleOutsideClick);
    document.removeEventListener('scroll', this.handleHide);
    document.removeEventListener('contextmenu', this.handleHide);
    document.removeEventListener('keydown', this.handleKeyNavigation);
    window.removeEventListener('resize', this.handleHide);
  };

  private handleShow = (e): void => {
    if (e.detail.id !== this.props.id || this.state.isVisible) {
      return;
    }

    const { x, y } = e.detail.position;

    this.setState({ isVisible: true, x, y });
    this.registerHandlers();
    callIfExists(this.props.onShow, e);
  };

  private handleHide = (e): void => {
    if (this.state.isVisible && (!e.detail || !e.detail.id || e.detail.id === this.props.id)) {
      this.unregisterHandlers();
      this.setState({ forceSubMenuOpen: false, isVisible: false, selectedItem: null });
      callIfExists(this.props.onHide, e);
    }
  };

  private handleOutsideClick = (e): void => {
    if (!this.menu.contains(e.target)) {
      hideMenu();
    }
  };

  private handleMouseLeave = (event): void => {
    event.preventDefault();

    callIfExists(this.props.onMouseLeave, event, { ...this.props.data, ...store.data }, store.target);

    if (this.props.hideOnLeave) {
      hideMenu();
    }
  };

  private handleContextMenu = (e) => {
    if (process.env.NODE_ENV === 'production') {
      e.preventDefault();
    }

    this.handleHide(e);
  };

  hideMenu = (e) => {
    if (e.keyCode === 27 || e.keyCode === 13) {
      // ECS or enter
      hideMenu();
    }
  };

  getMenuPosition = (x = 0, y = 0) => {
    const menuStyles = {
      left: x,
      top: y,
    };

    if (!this.menu) {
      return menuStyles;
    }

    const { innerHeight, innerWidth } = window;
    const rect = this.menu.getBoundingClientRect();

    if (y + rect.height > innerHeight) {
      menuStyles.top -= rect.height;
    }

    if (x + rect.width > innerWidth) {
      menuStyles.left -= rect.width;
    }

    if (menuStyles.top < 0) {
      menuStyles.top = rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
    }

    if (menuStyles.left < 0) {
      menuStyles.left = rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
    }

    return menuStyles;
  };

  getRTLMenuPosition = (x = 0, y = 0) => {
    const menuStyles = {
      left: x,
      top: y,
    };

    if (!this.menu) {
      return menuStyles;
    }

    const { innerHeight, innerWidth } = window;
    const rect = this.menu.getBoundingClientRect();

    // Try to position the menu on the left side of the cursor
    menuStyles.left = x - rect.width;

    if (y + rect.height > innerHeight) {
      menuStyles.top -= rect.height;
    }

    if (menuStyles.left < 0) {
      menuStyles.left += rect.width;
    }

    if (menuStyles.top < 0) {
      menuStyles.top = rect.height < innerHeight ? (innerHeight - rect.height) / 2 : 0;
    }

    if (menuStyles.left + rect.width > innerWidth) {
      menuStyles.left = rect.width < innerWidth ? (innerWidth - rect.width) / 2 : 0;
    }

    return menuStyles;
  };

  menuRef = (c: HTMLElement): void => {
    this.menu = c;
  };

  render(): React.JSX.Element {
    const { children, className, style } = this.props;
    const { isVisible } = this.state;
    const inlineStyle = {
      ...style,
      opacity: 0,
      pointerEvents: 'none',
      position: 'fixed',
    };
    const menuClassnames = cx(cssClasses.menu, className, {
      [cssClasses.menuVisible]: isVisible,
    });

    return createPortal(
      <nav
        className={menuClassnames}
        onContextMenu={this.handleContextMenu}
        onMouseLeave={this.handleMouseLeave}
        ref={this.menuRef}
        role="menu"
        style={inlineStyle}
        tabIndex={-1}
      >
        {this.renderChildren(children)}
      </nav>,
      document.body,
    );
  }
}
