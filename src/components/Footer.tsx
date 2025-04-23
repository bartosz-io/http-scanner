import React from 'react';
import { Link } from 'react-router-dom';
import scannerLogo from '../assets/scanner-logo.png';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={scannerLogo} 
                alt="HTTP Scanner Logo" 
                className="h-6 w-6" 
              />
              <h3 className="text-lg font-bold">HTTP Scanner</h3>
            </div>
            <p className="text-muted-foreground">
              A tool for scanning and analyzing HTTP security headers to improve your website's security posture.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-muted-foreground hover:text-foreground transition-colors">
                  Reports
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  MDN HTTP Headers
                </a>
              </li>
              <li>
                <a 
                  href="https://owasp.org/www-project-secure-headers/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  OWASP Secure Headers
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>© {currentYear} HTTP Scanner. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
