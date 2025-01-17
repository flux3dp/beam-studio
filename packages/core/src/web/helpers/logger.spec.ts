import Logger from './logger';

test('test logger', () => {
  const logger = Logger('abc');
  const logger2 = Logger('xyz');
  logger.append(1);
  logger.append('flux');
  logger2.append(true);
  logger2.append({
    title: 'Hello World',
  });
  expect(logger.getAll()).toEqual({
    abc: [1, 'flux'],
    xyz: [true, {
      title: 'Hello World',
    }],
  });
  expect(logger2.getAll()).toEqual({
    abc: [1, 'flux'],
    xyz: [true, {
      title: 'Hello World',
    }],
  });

  logger.clear();
  expect(logger.getAll()).toEqual({
    xyz: [true, {
      title: 'Hello World',
    }],
  });
  expect(logger2.getAll()).toEqual({
    xyz: [true, {
      title: 'Hello World',
    }],
  });
});
