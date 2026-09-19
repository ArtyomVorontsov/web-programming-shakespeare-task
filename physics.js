document.addEventListener("DOMContentLoaded", () => {
    const gravityBtn = document.getElementById("gravity-btn");
    
    // Make sure we only initialize physics once
    let physicsInitialized = false;

    gravityBtn.addEventListener("click", () => {
        if (physicsInitialized) return;
        physicsInitialized = true;
        
        // Keep the button styling as is while it falls, but remove the animation
        // so Matter.js can control the transform property!
        gravityBtn.style.animation = 'none';

        initPhysics();
    });
});

function initPhysics() {
    const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Composite } = Matter;

    // Make non-text blocks fall as well by giving them the target class directly
    document.querySelectorAll('img, .seal, .ornament-box, button, a.share-btn, a.action-link').forEach(el => {
        el.classList.add('matter-word');
        // Prevent default click behavior so you don't navigate when trying to grab them
        if (el.tagName === 'A') {
            el.addEventListener('click', e => e.preventDefault());
        }
    });

    // Select all text containers to break apart into individual word bodies
    const elementsToWrap = document.querySelectorAll('p, h1, h2, h3, h4, span:not(.logo):not(.matter-word)');
    
    // Function to recursively wrap every single word in a <span>
    function wrapWords(element) {
        const nodes = Array.from(element.childNodes);
        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const words = node.textContent.split(/(\s+)/);
                const fragment = document.createDocumentFragment();
                words.forEach(word => {
                    if (word.trim().length > 0) {
                        const span = document.createElement('span');
                        span.className = 'matter-word';
                        span.textContent = word;
                        span.style.display = 'inline-block';
                        span.style.cursor = 'grab';
                        fragment.appendChild(span);
                    } else {
                        fragment.appendChild(document.createTextNode(word));
                    }
                });
                element.replaceChild(fragment, node);
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR' && node.tagName !== 'I') {
                wrapWords(node);
            }
        });
    }

    elementsToWrap.forEach(el => wrapWords(el));

    const wordSpans = document.querySelectorAll('.matter-word');

    const engine = Engine.create();
    const world = engine.world;
    
    const bodies = [];
    const elements = [];

    // Scroll slightly so the user is aware of the viewport bounds
    // We lock the scrolling so the physics box is the current screen
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';

    // Create a body for each word
    wordSpans.forEach((span, index) => {
        const rect = span.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) return;

        // Matter.js coordinates are center-based
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2 + scrollY;

        // Add a slight random delay effect to the initial pop if desired,
        // but simple rectangles are fine.
        const body = Bodies.rectangle(x, y, rect.width, rect.height, {
            restitution: 0.6, // Bouncy words
            friction: 0.1,
            frictionAir: 0.01,
            density: 0.005,
            render: { visible: false }
        });

        // BLAST EFFECT: Throw elements in different directions
        const blastForce = 35;
        const vx = (Math.random() - 0.5) * blastForce;
        const vy = (Math.random() - 0.5) * blastForce - 15; // Bias upwards for an arc
        
        Matter.Body.setVelocity(body, { x: vx, y: vy });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.8);

        bodies.push(body);
        elements.push({ span, body, width: rect.width, height: rect.height });
    });

    // We must apply absolute positioning now
    elements.forEach(({ span, body, width, height }) => {
        // We set fixed dimensions and zero out margins/padding offsets
        span.style.position = 'absolute';
        span.style.margin = '0';
        span.style.width = width + 'px';
        span.style.height = height + 'px';
        span.style.left = '0';
        span.style.top = '0';
        // Immediately sync to current pos so there is no visual jump
        span.style.transform = `translate(${body.position.x - width/2}px, ${body.position.y - height/2}px) rotate(${body.angle}rad)`;
        span.style.zIndex = '9999';
        span.style.whiteSpace = 'nowrap';
        span.style.userSelect = 'none'; // Prevent text selection when dragging
        span.style.webkitUserSelect = 'none';
    });

    Composite.add(world, bodies);

    // Create boundaries (Walls and Floor relative to current Viewport)
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;
    const thickness = 100;
    
    const ground = Bodies.rectangle(viewportWidth / 2, scrollY + viewportHeight + thickness / 2 - 10, viewportWidth * 3, thickness, { isStatic: true });
    const leftWall = Bodies.rectangle(-thickness / 2, scrollY + viewportHeight / 2, thickness, viewportHeight * 3, { isStatic: true });
    const rightWall = Bodies.rectangle(viewportWidth + thickness / 2, scrollY + viewportHeight / 2, thickness, viewportHeight * 3, { isStatic: true });
    const ceiling = Bodies.rectangle(viewportWidth / 2, scrollY - thickness / 2, viewportWidth * 3, thickness, { isStatic: true });

    Composite.add(world, [ground, leftWall, rightWall, ceiling]);

    // Setup mouse interaction so words can be picked up and thrown
    const mouse = Mouse.create(document.body);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false }
        }
    });
    
    Composite.add(world, mouseConstraint);

    // Start engine
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Sync DOM elements with Matter.js bodies on every frame
    const syncDOM = () => {
        elements.forEach(({ span, body, width, height }) => {
            span.style.transform = `translate(${body.position.x - width/2}px, ${body.position.y - height/2}px) rotate(${body.angle}rad)`;
        });
        requestAnimationFrame(syncDOM);
    };
    
    requestAnimationFrame(syncDOM);
}
