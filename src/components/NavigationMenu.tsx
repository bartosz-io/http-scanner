import React from 'react';
import { Link } from 'react-router-dom';
import {
  NavigationMenu as ShadcnNavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export const NavigationMenu: React.FC = () => {
  return (
    <ShadcnNavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link to="/" className={navigationMenuTriggerStyle()}>
            Home
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link to="/reports" className={navigationMenuTriggerStyle()}>
            Reports
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link to="/about" className={navigationMenuTriggerStyle()}>
            About
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </ShadcnNavigationMenu>
  );
};
