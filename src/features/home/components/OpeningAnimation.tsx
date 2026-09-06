"use client";
import React, { useState, useEffect } from 'react';
import MyraLogo from '@/components/shared/MyraLogo';

const OpeningAnimation = () => {
    // 0 = closed, 1 = inner doors open, 2 = all doors slide off, 3 = hidden
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        // UX optimization: Only play the animation once per session
        if (sessionStorage.getItem('myra_animation_played')) {
            setPhase(3); // Instantly hide it if they've already seen it
            return;
        }

        // Step 1: Open the inner doors to reveal the logo
        const timer1 = setTimeout(() => setPhase(1), 300);

        // Step 2: Slide all doors completely off the screen (triggering right before step 1 finishes for fluidity)
        const timer2 = setTimeout(() => setPhase(2), 850);

        // Step 3: Unmount the entire animation overlay shortly after step 2 completes
        const timer3 = setTimeout(() => {
            setPhase(3);
            // Mark as played for future navigation in this session ONLY AFTER it finishes
            // This prevents React StrictMode from instantly aborting it in dev mode!
            sessionStorage.setItem('myra_animation_played', 'true');
        }, 1600);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    // Once the animation is fully complete, remove the overlay completely
    if (phase === 3) return null;

    return (
        <>
            <div 
                id="myra-opening-anim"
                suppressHydrationWarning
                className={`fixed inset-0 z-[9999] overflow-hidden items-center justify-center ${
                    phase >= 2 ? 'pointer-events-none' : 'pointer-events-auto'
                }`}
            >
                <script
                    dangerouslySetInnerHTML={{
                        __html: "(function(){try{if(sessionStorage.getItem('myra_animation_played')){var e=document.getElementById('myra-opening-anim');if(e)e.style.display='none';}}catch(t){}})();"
                    }}
                />
                {/* The Logo and Background (fades out as doors slide away) */}
                <div 
                    suppressHydrationWarning
                    className={`absolute inset-0 bg-[#f0f0f0] flex items-center justify-center z-0 transition-opacity duration-700 ease-in-out ${
                        phase >= 2 ? 'opacity-0' : 'opacity-100'
                    }`}
                >
                    <MyraLogo className="h-16 md:h-24 lg:h-32 w-auto object-contain pointer-events-none select-none" />
                </div>

                {/* The Doors Container */}
                <div 
                    suppressHydrationWarning
                    className="absolute inset-0 flex w-full h-full z-10 items-center justify-center pointer-events-none select-none"
                >
                    <div 
                        suppressHydrationWarning
                        className="flex h-full flex-nowrap items-center justify-center pointer-events-none"
                    >
                        {/* --- LEFT SIDE DOORS --- */}
                        <img 
                            suppressHydrationWarning
                            draggable={false}
                            data-pin-nopin="true"
                            data-pin-no-hover="true"
                            className={`shrink-0 h-full w-auto relative z-10 pointer-events-none select-none transition-transform duration-700 ease-in-out ${
                                phase >= 2 ? 'translate-x-[-100%]' : 'translate-x-0'
                            }`} 
                            src="/animation/opening/design.png" 
                            alt="" 
                        />
                        
                        <img 
                            suppressHydrationWarning
                            draggable={false}
                            data-pin-nopin="true"
                            data-pin-no-hover="true"
                            className={`shrink-0 h-full w-auto relative z-20 pointer-events-none select-none transition-transform duration-700 ease-in-out ${
                                phase >= 2 ? 'translate-x-[-200%]' : 'translate-x-0'
                            }`} 
                            src="/animation/opening/design.png" 
                            alt="" 
                        />
                        
                        <img 
                            suppressHydrationWarning
                            draggable={false}
                            data-pin-nopin="true"
                            data-pin-no-hover="true"
                            className={`shrink-0 h-full w-auto relative z-30 pointer-events-none select-none transition-transform duration-700 ease-in-out ${
                                phase >= 2 ? 'translate-x-[-300%]' : phase >= 1 ? 'translate-x-[-100%]' : 'translate-x-0'
                            }`} 
                            src="/animation/opening/design1.png" 
                            alt="" 
                        />

                        {/* --- RIGHT SIDE DOORS --- */}
                        <img 
                            suppressHydrationWarning
                            draggable={false}
                            data-pin-nopin="true"
                            data-pin-no-hover="true"
                            className={`shrink-0 h-full w-auto relative z-30 pointer-events-none select-none -scale-x-100 transition-transform duration-700 ease-in-out ${
                                phase >= 2 ? 'translate-x-[300%]' : phase >= 1 ? 'translate-x-[100%]' : 'translate-x-0'
                            }`} 
                            src="/animation/opening/design1.png" 
                            alt="" 
                        />
                        
                        <img 
                            suppressHydrationWarning
                            draggable={false}
                            data-pin-nopin="true"
                            data-pin-no-hover="true"
                            className={`shrink-0 h-full w-auto relative z-20 pointer-events-none select-none -scale-x-100 transition-transform duration-700 ease-in-out ${
                                phase >= 2 ? 'translate-x-[200%]' : 'translate-x-0'
                            }`} 
                            src="/animation/opening/design.png" 
                            alt="" 
                        />
                        
                        <img 
                            suppressHydrationWarning
                            draggable={false}
                            data-pin-nopin="true"
                            data-pin-no-hover="true"
                            className={`shrink-0 h-full w-auto relative z-10 pointer-events-none select-none -scale-x-100 transition-transform duration-700 ease-in-out ${
                                phase >= 2 ? 'translate-x-[100%]' : 'translate-x-0'
                            }`} 
                            src="/animation/opening/design.png" 
                            alt="" 
                        />
                    </div>
                </div>
            </div>
        </>
    )
}

export default OpeningAnimation;
