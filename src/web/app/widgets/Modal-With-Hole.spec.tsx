import * as React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';
import ModalWithHole from './Modal-With-Hole';

test('should render correctly', () => {
  expect(toJson(shallow(<ModalWithHole
    holePosition={{
      top: 10,
      bottom: 10,
      left: 20,
      right: 20,
    }}
    holeSize={{
      width: 100,
      height: 200,
    }}
    className="abc"
  />))).toMatchSnapshot();

  expect(toJson(shallow(<ModalWithHole
    holeSize={{
      width: 100,
      height: 200,
    }}
    className="abc"
  />))).toMatchSnapshot();

  expect(toJson(shallow(<ModalWithHole
    holePosition={{
    }}
    holeSize={{
    }}
    className="abc"
  />))).toMatchSnapshot();
});
