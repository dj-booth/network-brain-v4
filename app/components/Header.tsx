'use client';

import React from 'react';
import Link from 'next/link';
import { Menu } from 'semantic-ui-react';

export const Header = () => {
  return (
    <Menu pointing secondary>
      <Menu.Item name='Network Brain v4' as={Link} href='/' active={true} />
      
      <Menu.Menu position='right'>
        <Menu.Item as={Link} href='/'>
          Import Data
        </Menu.Item>
      </Menu.Menu>
    </Menu>
  );
}; 