import { Link } from "react-router-dom";
import { BookOpen, Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-foreground">Meskerm School</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Empowering Ethiopian students through innovative digital education and excellence in learning.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {["About", "Academics", "Admissions", "News", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    to={`/${item.toLowerCase()}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Addis Ababa, Ethiopia
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="mt-0.5 h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  +251 11 XXX XXXX
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="mt-0.5 h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  info@meskermsecondary.edu.et
                </span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-all hover:bg-primary hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Meskerm Secondary School. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
