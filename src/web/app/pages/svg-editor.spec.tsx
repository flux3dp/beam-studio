import * as React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';

const mockGet = jest.fn();
jest.mock('helpers/storage-helper', () => ({
  get: mockGet,
}));

jest.mock('helpers/i18n', () => ({
  lang: {
    beambox: {
      context_menu: {
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        paste_in_place: 'Paste in Place',
        delete: 'Delete',
        group: 'Group',
        ungroup: 'Ungroup',
        move_front: 'Bring to Front',
        move_up: 'Bring Forward',
        move_down: 'Send Backward',
        move_back: 'Send to Back',
      },
    },
  },
}));

jest.mock('app/views/beambox/Task-Interpreter-Panel', () => function DummyTaskInterpreterPanel() {
  return (
    <div>
      This is dummy TaskInterpreterPanel
    </div>
  );
});

jest.mock('app/views/beambox/Right-Panels/Right-Panel', () => ({
  RightPanel: function DummyRightPanel() {
    return (
      <div>
        This is dummy RightPanel
      </div>
    );
  },
}));

jest.mock('app/views/beambox/Right-Panels/contexts/RightPanelContext', () => ({
  RightPanelContextProvider: function DummyRightPanelContextProvider(props) {
    // eslint-disable-next-line react/prop-types
    const { children } = props;
    return (
      <div>
        This is dummy RightPanelContextProvider
        {children}
      </div>
    );
  },
}));

const mockInit = jest.fn();
jest.mock('app/actions/beambox/svg-editor', () => ({
  init: mockInit,
}));

// eslint-disable-next-line import/first, import/order
import SVGEditor from './svg-editor';

describe('test Skip-Connect-Machine', () => {
  test('should render correctly in mac', () => {
    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    mockGet.mockReturnValue('inches');
    Object.defineProperty(process, 'platform', {
      value: 'darwin',
    });
    const wrapper = mount(<SVGEditor />);
    expect(toJson(wrapper)).toMatchSnapshot();

    wrapper.find('a[href="#cut"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);

    wrapper.find('a[href="#copy"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(event.stopPropagation).toHaveBeenCalledTimes(2);

    wrapper.find('a[href="#paste"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(3);
    expect(event.stopPropagation).toHaveBeenCalledTimes(3);

    wrapper.find('a[href="#paste_in_place"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(4);
    expect(event.stopPropagation).toHaveBeenCalledTimes(4);

    wrapper.find('a[href="#delete"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(5);
    expect(event.stopPropagation).toHaveBeenCalledTimes(5);

    wrapper.find('a[href="#group"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(6);
    expect(event.stopPropagation).toHaveBeenCalledTimes(6);

    wrapper.find('a[href="#ungroup"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(7);
    expect(event.stopPropagation).toHaveBeenCalledTimes(7);

    wrapper.find('a[href="#move_front"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(8);
    expect(event.stopPropagation).toHaveBeenCalledTimes(8);

    wrapper.find('a[href="#move_up"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(9);
    expect(event.stopPropagation).toHaveBeenCalledTimes(9);

    wrapper.find('a[href="#move_down"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(10);
    expect(event.stopPropagation).toHaveBeenCalledTimes(10);

    wrapper.find('a[href="#move_back"]').simulate('click', event);
    expect(event.preventDefault).toHaveBeenCalledTimes(11);
    expect(event.stopPropagation).toHaveBeenCalledTimes(11);
  });

  test('should render correctly in win', () => {
    mockGet.mockReturnValue('mm');
    Object.defineProperty(process, 'platform', {
      value: 'win32',
    });
    const wrapper = mount(<SVGEditor />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
