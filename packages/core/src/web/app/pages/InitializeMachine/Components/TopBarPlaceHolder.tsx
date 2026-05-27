import React, { memo } from 'react';

import styles from './TopBarPlaceHolder.module.scss';

const TopBarPlaceHolder = memo((): React.JSX.Element => <div className={styles.container} />);

export default TopBarPlaceHolder;
