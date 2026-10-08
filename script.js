document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if(hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            if(navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when a link is clicked
    const links = document.querySelectorAll('.nav-links li a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            if(navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // Hide Navbar on Scroll Down, Show on Scroll Up
    let prevScrollpos = window.pageYOffset;
    const navbar = document.getElementById("navbar");

    window.onscroll = function() {
        let currentScrollPos = window.pageYOffset;
        if (prevScrollpos > currentScrollPos) {
            navbar.style.top = "0"; // Show
        } else {
            if(currentScrollPos > 100) {
                navbar.style.top = "-100px"; // Hide
            }
        }
        prevScrollpos = currentScrollPos;
    }
    
    // Add simple fade-in animation on scroll using Intersection Observer
    const sections = document.querySelectorAll('.section');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };
    
    const sectionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        // Initial state for animation
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        
        sectionObserver.observe(section);
    });
});


// --- SOC Network Background Animation ---
const initNetworkBackground = () => {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let nodes = [];
    let dataPackets = [];
    
    // Accessibility check: disable heavy canvas animation if requested
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Configuration
    const nodeCount = 50; 
    const maxDistance = 180;
    const baseColor = 'rgba(100, 255, 218,'; // Neon cyan/teal
    
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const resize = () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Mouse Parallax Effect
    window.addEventListener('mousemove', (e) => {
        // Calculate offset from center, scaled down for subtlety
        mouse.targetX = (e.clientX - width / 2) * 0.03;
        mouse.targetY = (e.clientY - height / 2) * 0.03;
    });

    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            // Very slow, subtle drift
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.radius = Math.random() * 1.5 + 0.5;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Wrap around edges seamlessly
            if (this.x < -50) this.x = width + 50;
            if (this.x > width + 50) this.x = -50;
            if (this.y < -50) this.y = height + 50;
            if (this.y > height + 50) this.y = -50;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${baseColor} 0.4)`;
            ctx.fill();
        }
    }

    class DataPacket {
        constructor(startNode, endNode) {
            this.start = startNode;
            this.end = endNode;
            this.progress = 0;
            this.speed = Math.random() * 0.008 + 0.004; // Slow moving packets
        }
        update() {
            this.progress += this.speed;
            return this.progress >= 1; 
        }
        draw() {
            const x = this.start.x + (this.end.x - this.start.x) * this.progress;
            const y = this.start.y + (this.end.y - this.start.y) * this.progress;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `${baseColor} 0.9)`;
            ctx.shadowBlur = 6;
            ctx.shadowColor = `${baseColor} 1)`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    // Initialize Nodes
    for (let i = 0; i < nodeCount; i++) {
        nodes.push(new Node());
    }

    const drawNetwork = () => {
        // Smooth mouse interpolation for parallax
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        ctx.clearRect(0, 0, width, height);
        
        ctx.save();
        ctx.translate(mouse.x, mouse.y); 

        // Update and Draw Nodes
        nodes.forEach(node => {
            node.update();
            node.draw();
        });

        // Draw Connections and Spawn Packets
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDistance) {
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    
                    // Fade lines out as they get further apart
                    const opacity = 1 - (dist / maxDistance);
                    ctx.strokeStyle = `${baseColor} ${opacity * 0.15})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();

                    // Occasional data packet creation along connections
                    if (Math.random() < 0.0005) {
                        dataPackets.push(new DataPacket(nodes[i], nodes[j]));
                    }
                }
            }
        }

        // Update and Draw Packets
        for (let i = dataPackets.length - 1; i >= 0; i--) {
            const finished = dataPackets[i].update();
            dataPackets[i].draw();
            if (finished) dataPackets.splice(i, 1);
        }

        ctx.restore();
        requestAnimationFrame(drawNetwork);
    };

    drawNetwork();
    
    // --- Dynamic SOC Logs Update Effect ---
    const logs = document.querySelectorAll('.log-line');
    const prefixes = ['[SIEM]', '[EDR]', '[SOC]', '[NETWORK]', '[THREAT]', '[FIREWALL]', '[IDS]', '[PROXY]'];
    const statuses = ['OK', 'SECURE', 'ACTIVE', 'STANDBY', 'ANALYZING...', 'MONITORING', 'CLEAN', 'VERIFIED'];
    const tasks = ['EVENT_MONITORING', 'ENDPOINT_STATUS', 'TRAFFIC_ANALYSIS', 'PACKET_INSPECTION', 'LOG_AGGREGATION'];
    
    setInterval(() => {
        if (logs.length > 0) {
            // Pick a random log line to update occasionally for a "live" feel
            if(Math.random() > 0.4) {
                const randomLog = logs[Math.floor(Math.random() * logs.length)];
                const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                const task = tasks[Math.floor(Math.random() * tasks.length)];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                randomLog.innerText = `>${prefix} ${task}... ${status}`;
            }
        }
    }, 4000); // Change text every 4 seconds
};

initNetworkBackground();


// --- Live Counter Updates for SVG Visualization ---
const eventCounters = document.querySelectorAll('.counter');
setInterval(() => {
    eventCounters.forEach(counter => {
        // Randomly update a few counters to simulate live incoming logs
        if (Math.random() > 0.6) {
            let text = counter.innerHTML;
            let match = text.match(/ev:\s*([\d.]+)([km]?)/);
            if (match) {
                let num = parseFloat(match[1]);
                let suffix = match[2];
                // Increment slightly
                num += (Math.random() * 0.2); 
                counter.innerHTML = `ev: ${num.toFixed(1)}${suffix}`;
            }
        }
    });
}, 1500);


// --- Cyber Timeline Scroll Animation ---
document.addEventListener('DOMContentLoaded', () => {
    const timelines = document.querySelectorAll('.cyber-timeline');
    
    if (timelines.length > 0) {
        const updateTimelines = () => {
            const windowHeight = window.innerHeight;
            const drawPoint = windowHeight * 0.6;
            
            timelines.forEach(timeline => {
                const progressLine = timeline.querySelector('.cyber-timeline-progress');
                const timelineItems = timeline.querySelectorAll('.cyber-timeline-item');
                
                if (!progressLine || timelineItems.length === 0) return;
                
                const rect = timeline.getBoundingClientRect();
                
                // Distance from the draw point to the top of the timeline container
                let heightToDraw = drawPoint - rect.top;
                
                // Clamp the height between 0 and the total height of the timeline
                if (heightToDraw < 0) heightToDraw = 0;
                if (heightToDraw > rect.height) heightToDraw = rect.height;
                
                // Update the height of the glowing progress line
                progressLine.style.height = `${heightToDraw}px`;
                
                // Check each timeline item dot
                timelineItems.forEach(item => {
                    const dot = item.querySelector('.cyber-timeline-dot');
                    if (dot) {
                        const dotTop = item.offsetTop + dot.offsetTop;
                        
                        // If the progress line has reached or passed this dot, light it up
                        if (heightToDraw >= dotTop) {
                            dot.classList.add('active');
                        } else {
                            dot.classList.remove('active');
                        }
                    }
                });
            });
        };

        // Listen for scroll and resize events
        window.addEventListener('scroll', () => {
            requestAnimationFrame(updateTimelines);
        });
        
        window.addEventListener('resize', () => {
            requestAnimationFrame(updateTimelines);
        });
        
        // Initial check on page load
        updateTimelines();
    }
});
