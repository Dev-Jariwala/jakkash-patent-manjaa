import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Mail, Calendar, Wind, Star, ArrowRight, Sparkles, Trophy, Users, Heart, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden">
            {/* Navigation - Solid Background */}
            <nav className="fixed w-full z-50 bg-card border-b border-border shadow-2xl">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <motion.img
                            src="/logo.png"
                            alt="Jakkash Manja"
                            className="h-12 w-auto object-contain drop-shadow-2xl"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                        />
                        <div>
                            <span className="text-2xl font-black text-primary">
                                Jakkash Manja
                            </span>
                        </div>
                    </div>
                    <div className="hidden md:flex gap-8 font-semibold text-foreground">
                        {['Home', 'About', 'Products', 'Contact'].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="hover:text-primary transition-all relative group"
                            >
                                {item}
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all"></span>
                            </a>
                        ))}
                    </div>
                    <motion.a
                        href="#contact"
                        className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold shadow-lg"
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(251, 146, 60, 0.4)" }}
                    >
                        Get Started
                    </motion.a>
                </div>
            </nav>

            {/* Hero Section - Full Immersive */}
            <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
                {/* Animated Gradient Background - DARK */}
                <div className="absolute">
                    {/* Dark overlay for better text contrast */}
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="absolute inset-0" style={{
                        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(251, 146, 60, 0.2) 0%, transparent 50%),
                                         radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.2) 0%, transparent 50%),
                                         radial-gradient(circle at 40% 20%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)`
                    }}></div>
                </div>

                {/* Floating Kites */}
                {[
                    { delay: 0, duration: 20, color: 'from-red-400 to-red-600', size: 'w-24 h-24', top: '20%', left: '-10%' },
                    { delay: 2, duration: 25, color: 'from-blue-400 to-blue-600', size: 'w-20 h-20', top: '60%', left: '-5%' },
                    { delay: 4, duration: 18, color: 'from-green-400 to-green-600', size: 'w-16 h-16', top: '40%', left: '-8%' },
                    { delay: 1, duration: 22, color: 'from-yellow-400 to-yellow-600', size: 'w-28 h-28', top: '10%', left: '-12%' },
                    { delay: 3, duration: 24, color: 'from-purple-400 to-purple-600', size: 'w-18 h-18', top: '70%', left: '-6%' },
                ].map((kite, i) => (
                    <motion.div
                        key={i}
                        initial={{ x: kite.left, y: kite.top, rotate: -20 }}
                        animate={{ x: '110vw', y: Math.random() * 100 + '%', rotate: 20 }}
                        transition={{ duration: kite.duration, repeat: Infinity, delay: kite.delay, ease: 'linear' }}
                        className={`absolute ${kite.size} bg-gradient-to-br ${kite.color} opacity-30 blur-sm`}
                        style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', top: kite.top }}
                    />
                ))}

                {/* Content */}
                <div className="container mx-auto px-6 relative z-10 py-32">
                    <div className="max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-md border border-border mb-8"
                        >
                            <Star className="w-5 h-5 text-primary fill-primary" />
                            <span className="font-semibold text-foreground">🪁 Uttarayan 2025 Special</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black mb-6 leading-tight text-foreground drop-shadow-2xl"
                        >
                            Conquer the{' '}
                            <span className="text-primary">
                                Sky
                            </span>
                            <br />
                            with Jakkash
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl mb-10 text-muted-foreground max-w-2xl leading-relaxed font-medium drop-shadow-lg"
                        >
                            Premium Manja & Firki crafted for champions. Sharp, durable, and designed for victory.
                            Experience the thrill of Makar Sankranti like never before.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-wrap gap-4"
                        >
                            <motion.a
                                href="#contact"
                                className="group px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg shadow-2xl flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Phone className="w-5 h-5" />
                                Order Now
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.a>
                            <motion.a
                                href="#products"
                                className="px-8 py-4 bg-secondary backdrop-blur-md border border-border rounded-full font-bold text-lg flex items-center gap-2 text-secondary-foreground"
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                View Products
                            </motion.a>
                        </motion.div>
                    </div>

                    {/* Floating Kite Visual - Enhanced */}
                    <motion.div
                        className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block"
                        initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                    >
                        <motion.div
                            animate={{ y: [-20, 20, -20], rotate: [-8, 8, -8] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative w-80 h-80"
                        >
                            {/* Kite Body */}
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80 shadow-2xl"
                                style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                            >
                                {/* Kite Design Pattern */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground/30 to-transparent" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 50%, 0% 50%)' }}></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-full bg-primary-foreground/20"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-primary-foreground/20"></div>
                            </div>
                            
                            {/* Kite Tail */}
                            <motion.div
                                className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-b from-primary to-transparent"
                                animate={{ rotate: [-5, 5, -5] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                {/* Tail Ribbons */}
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-8 h-8 bg-primary/60 rounded-full"
                                        style={{ top: `${i * 30}px`, left: '50%', transform: 'translateX(-50%)' }}
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.8, 0.6] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </motion.div>
                            
                            {/* String */}
                            <div className="absolute top-1/2 left-1/2 w-0.5 h-96 bg-gradient-to-b from-muted-foreground/40 to-transparent origin-top" style={{ transform: 'translateX(-50%) rotate(15deg)' }}></div>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="w-6 h-10 border-2 border-border rounded-full flex justify-center pt-2">
                        <motion.div
                            className="w-1.5 h-1.5 bg-foreground rounded-full"
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                </motion.div>
            </section>

            {/* About Section - Diagonal Split */}
            <section id="about" className="relative py-32">

                <div className="container mx-auto px-6 relative z-10">
                    {/* Header */}
                    <div className="text-center mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-5xl md:text-6xl font-black mb-6 text-foreground">
                                <span className="text-primary">
                                    Our Legacy
                                </span>
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                Operating as <span className="text-primary font-bold">"Jakash Petant Manja"</span>,
                                owned by <span className="text-primary font-bold">Kalpesh Chunawala</span>.
                                We bring families together through the joy of kite flying.
                            </p>
                        </motion.div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Trophy className="w-12 h-12" />,
                                title: 'Premium Quality',
                                desc: 'Our Manja is treated for maximum sharpness and strength, ensuring you dominate the sky.'
                            },
                            {
                                icon: <Calendar className="w-12 h-12" />,
                                title: 'Seasonal Special',
                                desc: 'Ready for January 14 & 15. The spirit of Makar Sankranti lives in every thread.'
                            },
                            {
                                icon: <Heart className="w-12 h-12" />,
                                title: 'Trust & Tradition',
                                desc: 'A trusted name in Surat for years. We bring families together through kite flying.'
                            }
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -10 }}
                                className="group relative"
                            >
                                {/* Glass Card - DARKER */}
                                <div className="relative p-8 rounded-3xl bg-card backdrop-blur-lg border border-border overflow-hidden h-full shadow-2xl">
                                    {/* Gradient Overlay on Hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>

                                    <div className="relative z-10">
                                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg`}>
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4 text-card-foreground">{feature.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed text-lg">{feature.desc}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Products Section */}
            <section id="products" className="relative py-32 bg-muted/30">
                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        className="text-center mb-20"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-5xl md:text-7xl font-black mb-6 text-foreground">
                            Our Products 🪁
                        </h2>
                        <p className="text-xl text-muted-foreground font-medium">
                            Premium quality Manja and Firki for the ultimate kite flying experience
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                        {/* Manja Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="group"
                        >
                            <div className="relative p-10 rounded-3xl bg-card border border-border overflow-hidden shadow-xl hover:shadow-2xl transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                                
                                <div className="relative z-10">
                                    <div className="text-7xl mb-6">🧵</div>
                                    <h3 className="text-4xl font-black mb-4 text-card-foreground">Manja</h3>
                                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                        Premium quality thread treated for maximum sharpness and durability. Available in vibrant colors.
                                    </p>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            <span>Sharp & Strong</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            <span>Multiple Colors</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            <span>Weather Resistant</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Firki Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="group"
                        >
                            <div className="relative p-10 rounded-3xl bg-card border border-border overflow-hidden shadow-xl hover:shadow-2xl transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                                
                                <div className="relative z-10">
                                    <motion.div 
                                        className="text-7xl mb-6"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                    >
                                        ⭕
                                    </motion.div>
                                    <h3 className="text-4xl font-black mb-4 text-card-foreground">Firki</h3>
                                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                        High-quality spools designed for smooth unwinding and maximum control during flight.
                                    </p>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            <span>Smooth Rotation</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            <span>Large Capacity</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                                            <span>Ergonomic Design</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Contact Section - Simple CTA */}
            <section id="contact" className="relative py-32">
                <div className="absolute inset-0 bg-muted/30"></div>

                <div className="container mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h2 className="text-5xl md:text-7xl font-black mb-6 text-foreground">
                            Ready to Fly? 🪁
                        </h2>
                        <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                            Get in touch with us for premium quality Manja and Firki. We're here to make your Uttarayan unforgettable!
                        </p>
                        <motion.a
                            href="tel:+919428670817"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-primary text-primary-foreground rounded-full font-bold text-xl shadow-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Phone className="w-6 h-6" />
                            Call Us Now
                        </motion.a>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative bg-card border-t border-border">
                <div className="container mx-auto px-6 py-16">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        {/* Brand Section */}
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-3 mb-4">
                                <motion.div
                                    className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center font-black text-2xl text-primary-foreground"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}
                                    whileHover={{ rotate: 180 }}
                                >
                                    J
                                </motion.div>
                                <div>
                                    <p className="font-black text-xl text-card-foreground">Jakkash Manja</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Premium Manja & Firki for champions. Making Uttarayan special since years.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-card-foreground">Quick Links</h3>
                            <ul className="space-y-2">
                                {['Home', 'About', 'Products', 'Contact'].map((item) => (
                                    <li key={item}>
                                        <a
                                            href={`#${item.toLowerCase()}`}
                                            className="text-muted-foreground hover:text-primary transition-colors text-sm"
                                        >
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-card-foreground">Contact Us</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-2">
                                    <Phone className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                                    <div className="text-sm">
                                        <a href="tel:+919428670817" className="text-muted-foreground hover:text-primary transition-colors block">
                                            +91 94286 70817
                                        </a>
                                        <a href="tel:+919824183096" className="text-muted-foreground hover:text-primary transition-colors block">
                                            +91 98241 83096
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Mail className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                                    <a href="mailto:jakkashmanja@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                        jakkashmanja@gmail.com
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Address & Social */}
                        <div>
                            <h3 className="font-bold text-lg mb-4 text-card-foreground">Visit Us</h3>
                            <div className="flex items-start gap-2 mb-6">
                                <MapPin className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    40 Ganeshkrupa Society,<br />
                                    Rander Road, Tadwadi Chowk,<br />
                                    Surat, Gujarat, 395009
                                </p>
                            </div>
                            
                            {/* Social Media */}
                            <div>
                                <h4 className="font-semibold text-sm mb-3 text-card-foreground">Follow Us</h4>
                                <div className="flex gap-3">
                                    {[
                                        { icon: Facebook, href: '#', label: 'Facebook' },
                                        { icon: Instagram, href: '#', label: 'Instagram' },
                                        { icon: Twitter, href: '#', label: 'Twitter' },
                                        { icon: Youtube, href: '#', label: 'YouTube' }
                                    ].map((social) => (
                                        <motion.a
                                            key={social.label}
                                            href={social.href}
                                            aria-label={social.label}
                                            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <social.icon className="w-4 h-4" />
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Jakash Petant Manja. All rights reserved.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Owned by <span className="text-primary font-semibold">Kalpesh Chunawala</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;