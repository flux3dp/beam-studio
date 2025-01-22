/* eslint-disable ts/no-unused-vars */
import React, { Component } from 'react';

import MenuItem from './MenuItem';

export default class AbstractMenu extends Component<any, any> {
  private seletedItemRef: any;

  constructor(props) {
    super(props);

    this.seletedItemRef = null;
    this.state = {
      forceSubMenuOpen: false,
      selectedItem: null,
    };
  }

  handleKeyNavigation = (e) => {
    // check for isVisible strictly here as it might be undefined
    // when this code executes in the context of SubMenu
    // but we only need to check when it runs in the ContextMenu context
    const { isVisible } = this.state;

    if (isVisible === false) {
      return;
    }

    switch (e.keyCode) {
      case 37: // left arrow
      case 27: // escape
        e.preventDefault();
        this.hideMenu(e);
        break;
      case 38: // up arrow
        e.preventDefault();
        this.selectChildren(true);
        break;
      case 40: // down arrow
        e.preventDefault();
        this.selectChildren(false);
        break;
      case 39: // right arrow
        this.tryToOpenSubMenu(e);
        break;
      case 13: // enter
        e.preventDefault();
        this.tryToOpenSubMenu(e);
        {
          // determine the selected item is disabled or not
          const disabled = this.seletedItemRef && this.seletedItemRef.props && this.seletedItemRef.props.disabled;

          if (this.seletedItemRef && this.seletedItemRef.ref instanceof HTMLElement && !disabled) {
            this.seletedItemRef.ref.click();
          } else {
            this.hideMenu(e);
          }
        }
        break;
      default:
      // do nothing
    }
  };

  handleForceClose = () => {
    this.setState({ forceSubMenuOpen: false });
  };

  getSubMenuType(): any {
    throw new Error('hideMenu not implemented');
  }

  tryToOpenSubMenu = (e) => {
    const { selectedItem } = this.state;

    if (selectedItem && selectedItem.type === this.getSubMenuType()) {
      e.preventDefault();
      this.setState({ forceSubMenuOpen: true });
    }
  };

  selectChildren = (forward) => {
    const { selectedItem } = this.state;
    const children = [];
    let disabledChildrenCount = 0;
    const disabledChildIndexes = {};

    const childCollector = (child, index) => {
      // child can be empty in case you do conditional rendering of components, in which
      // case it should not be accounted for as a real child
      if (!child) {
        return;
      }

      if (![MenuItem, this.getSubMenuType()].includes(child.type)) {
        // Maybe the MenuItem or SubMenu is capsuled in a wrapper div or something else
        React.Children.forEach(child.props.children, childCollector);
      } else if (!child.props.divider) {
        if (child.props.disabled) {
          disabledChildrenCount += 1;
          disabledChildIndexes[index] = true;
        }

        children.push(child);
      }
    };

    const { children: propsChildren } = this.props;

    React.Children.forEach(propsChildren, childCollector);

    if (disabledChildrenCount === children.length) {
      // All menu items are disabled, so none can be selected, don't do anything
      return;
    }

    function findNextEnabledChildIndex(currentIndex) {
      let i = currentIndex;
      const incrementCounter = () => {
        if (forward) {
          i -= 1;
        } else {
          i += 1;
        }

        if (i < 0) {
          i = children.length - 1;
        } else if (i >= children.length) {
          i = 0;
        }
      };

      do {
        incrementCounter();
      } while (i !== currentIndex && disabledChildIndexes[i]);

      return i === currentIndex ? null : i;
    }

    const currentIndex = children.indexOf(selectedItem);
    const nextEnabledChildIndex = findNextEnabledChildIndex(currentIndex);

    if (nextEnabledChildIndex !== null) {
      this.setState({
        forceSubMenuOpen: false,
        selectedItem: children[nextEnabledChildIndex],
      });
    }
  };

  onChildMouseMove = (child): void => {
    const { selectedItem } = this.state;

    if (selectedItem !== child) {
      this.setState({ forceSubMenuOpen: false, selectedItem: child });
    }
  };

  onChildMouseLeave = (): void => {
    this.setState({ forceSubMenuOpen: false, selectedItem: null });
  };

  hideMenu(e: Event): void {
    throw new Error('hideMenu not implemented');
  }

  renderChildren = (children) =>
    React.Children.map(children, (child: Component<{ children: React.ReactNode; divider: any }>) => {
      const props: any = {};

      if (!React.isValidElement(child)) {
        return child;
      }

      if (![MenuItem, this.getSubMenuType()].includes(child.type)) {
        // Maybe the MenuItem or SubMenu is capsuled in a wrapper div or something else
        props.children = this.renderChildren(child.props.children);

        return React.cloneElement(child, props);
      }

      props.onMouseLeave = this.onChildMouseLeave.bind(this);

      const { forceSubMenuOpen, selectedItem } = this.state;

      if (child.type === this.getSubMenuType()) {
        // special props for SubMenu only
        props.forceOpen = forceSubMenuOpen && selectedItem === child;
        props.forceClose = this.handleForceClose;
        props.parentKeyNavigationHandler = this.handleKeyNavigation;
      }

      if (!child.props.divider && selectedItem === child) {
        // special props for selected item only
        props.selected = true;
        props.ref = (ref) => {
          this.seletedItemRef = ref;
        };

        return React.cloneElement(child, props);
      }

      // onMouseMove is only needed for non selected items
      props.onMouseMove = () => this.onChildMouseMove(child);

      return React.cloneElement(child, props);
    });
}
