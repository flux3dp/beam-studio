import isObjectEmpty from './is-object-empty';

test('test is-object-empty', () => {
  const animal = {
    eat: () => {},
  };
  const rabbit = {};
  Object.setPrototypeOf(rabbit, animal);

  expect(isObjectEmpty(rabbit)).toBeTruthy();
  expect(isObjectEmpty(animal)).toBeFalsy();
});
