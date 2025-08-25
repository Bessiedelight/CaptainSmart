"use client";
import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { X } from "lucide-react";

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement[]>([]);
  const underlineRefs = useRef<HTMLDivElement[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const brandSectionRef = useRef<HTMLDivElement>(null);
  const footerSectionRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const navItems = [
    { label: "HOME", href: "/" },
    { label: "SMART NEWS", href: "/smart-news" },
    { label: "VIDEO & PODCAST", href: "/video-and-podcast" },
    { label: "EXPOSE CORNER", href: "/expose-corner" },
    { label: "MERCHANDISE", href: "/store" },
  ];

  // Add menu item to refs array
  const addToMenuItemsRef = (el: HTMLDivElement | null) => {
    if (el && !menuItemsRef.current.includes(el)) {
      menuItemsRef.current.push(el);
    }
  };

  // Add underline to refs array
  const addToUnderlineRefs = (el: HTMLDivElement | null) => {
    if (el && !underlineRefs.current.includes(el)) {
      underlineRefs.current.push(el);
    }
  };

  // Open animation
  useEffect(() => {
    if (isOpen && navRef.current && !isAnimating) {
      setIsAnimating(true);

      // Wait a frame to ensure all refs are populated
      requestAnimationFrame(() => {
        // Set initial states for smoother performance
        gsap.set(overlayRef.current, { opacity: 0 });
        gsap.set(navRef.current, {
          x: "100%",
          force3D: true,
        });
        gsap.set(closeButtonRef.current, { opacity: 0, scale: 0.8 });
        gsap.set(brandSectionRef.current, { opacity: 0, y: 15 });
        gsap.set(footerSectionRef.current, { opacity: 0, y: 15 });

        // Set initial states for menu items
        if (menuItemsRef.current.length > 0) {
          gsap.set(menuItemsRef.current, {
            opacity: 0,
            y: 20,
            force3D: true,
          });
        }

        // Set initial states for underlines
        if (underlineRefs.current.length > 0) {
          gsap.set(underlineRefs.current, {
            scaleX: 0,
            transformOrigin: "left center",
          });
        }

        // Create streamlined timeline
        const tl = gsap.timeline({
          onComplete: () => setIsAnimating(false),
        });

        // Animate overlay and nav panel simultaneously
        tl.to(overlayRef.current, {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
        }).to(
          navRef.current,
          {
            x: "0%",
            duration: 0.4,
            ease: "power3.out",
            force3D: true,
          },
          0
        );

        // Animate content elements
        tl.to(
          brandSectionRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          },
          "-=0.2"
        ).to(
          closeButtonRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "back.out(1.7)",
          },
          "-=0.25"
        );

        // Animate menu items with clean stagger - start much sooner
        if (menuItemsRef.current.length > 0) {
          tl.to(
            menuItemsRef.current,
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              stagger: 0.08,
              ease: "power2.out",
              force3D: true,
            },
            "-=0.35" // Start much sooner - almost immediately after panel starts sliding
          );
        }

        // Animate underlines for current routes
        if (underlineRefs.current.length > 0) {
          tl.to(
            underlineRefs.current,
            {
              scaleX: 1,
              duration: 0.5,
              ease: "power2.out",
            },
            "-=0.1" // Start slightly after menu items appear
          );
        }

        // Animate footer
        tl.to(
          footerSectionRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          },
          "-=0.2"
        );
      });
    }
  }, [isOpen]);

  // Close animation - simplified and fast
  const handleClose = () => {
    if (isAnimating) return;

    setIsAnimating(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setIsAnimating(false);
        onClose();
      },
    });

    // Simple fade out for all content simultaneously
    tl.to(
      [
        brandSectionRef.current,
        menuItemsRef.current,
        footerSectionRef.current,
        closeButtonRef.current,
      ],
      {
        opacity: 0,
        duration: 0.15,
        ease: "power2.in",
      }
    );

    // Slide nav panel out
    tl.to(
      navRef.current,
      {
        x: "100%",
        duration: 0.3,
        ease: "power3.in",
        force3D: true,
      },
      "-=0.05"
    );

    // Fade overlay
    tl.to(
      overlayRef.current,
      {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
      },
      "-=0.2"
    );
  };

  // Handle menu item click
  const handleMenuItemClick = () => {
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Navigation Panel */}
      <div
        ref={navRef}
        className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl"
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-black hover:bg-black/10 rounded-full transition-colors duration-200"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Content */}
        <div className="flex flex-col h-full pt-20 px-8">
          {/* Brand Section */}
          <div ref={brandSectionRef} className="mb-16">
            <div className="text-black text-sm font-medium tracking-wider mb-2">
              CAPTAIN
            </div>
            <div className="w-12 h-0.5 bg-black/60"></div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1">
            <ul className="space-y-8">
              {navItems.map((item) => {
                const isCurrentRoute = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link href={item.href} onClick={handleMenuItemClick}>
                      <div
                        ref={addToMenuItemsRef}
                        className={`text-2xl font-bold tracking-wide cursor-pointer relative inline-block ${
                          isCurrentRoute ? "text-black" : "text-black/70"
                        }`}
                      >
                        {item.label}
                        {/* Animated underline that only covers text width */}
                        {isCurrentRoute && (
                          <div
                            ref={addToUnderlineRefs}
                            className="absolute bottom-0 left-0 h-0.5 bg-black w-full"
                            style={{ transformOrigin: "left center" }}
                          />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Section */}
          <div ref={footerSectionRef} className="pb-8">
            <div className="space-y-4 text-black/70">
              <div className="text-sm font-medium">NEWS & STORIES</div>
              <div className="text-sm font-medium">SHOP</div>
              <div className="text-sm font-medium">ENQUIRIES</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
