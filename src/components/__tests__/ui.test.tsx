import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { Button, PillTabs } from '..';
import { HeartsPill } from '../ui/HeartsPill';

describe('Button', () => {
  it('renders its label and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Confirm" onPress={onPress} />);

    await fireEvent.press(screen.getByText('Confirm'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled while loading', async () => {
    const onPress = jest.fn();
    await render(<Button label="GO" loading onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('PillTabs', () => {
  it('marks the active tab and reports changes', async () => {
    const onChange = jest.fn();
    await render(
      <PillTabs
        items={[
          { key: 'Explore', label: 'Explore' },
          { key: 'Hot', label: 'Hot' },
        ]}
        activeKey="Explore"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Explore', selected: true })).toBeTruthy();
    await fireEvent.press(screen.getByText('Hot'));
    expect(onChange).toHaveBeenCalledWith('Hot');
  });
});

describe('HeartsPill', () => {
  it('shows a compact balance', async () => {
    await render(<HeartsPill value={14700} />);
    expect(screen.getByText('14.7K')).toBeTruthy();
  });
});
