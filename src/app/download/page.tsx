"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MdDownload, MdComputer, MdCloud, MdCheckCircle, MdArrowForward } from "react-icons/md";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "Is the desktop app free?",
    answer: "Yes, 100% free. All billing features are included with no limitations."
  },
  {
    question: "Where is my data stored?",
    answer: "Locally on your Windows machine using SQLite. Your data never leaves your computer unless you enable cloud backup."
  },
  {
    question: "Can I sync data to cloud?",
    answer: "Yes, with Cloud Backup (₹199/month or ₹1,999/year). This syncs your local data to our secure cloud servers."
  },
  {
    question: "Can I transfer data from web to desktop?",
    answer: "Yes. Export your data from the web app as CSV/JSON, then import it into the desktop app."
  }
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-blue-500">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-600/20 text-white">B</div>
            <span className="text-2xl font-bold tracking-tight">Billmensor</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
              Back to Home <MdArrowForward className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 w-fit mx-auto rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10"
          >
            <MdComputer className="w-20 h-20 text-blue-400" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-b from-white to-slate-400"
          >
            Download Billmensor
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-xl text-slate-400 mb-10"
          >
            Full-featured desktop app for Windows. Works offline. Data stored on YOUR machine.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 rounded-2xl group shadow-2xl shadow-blue-500/20">
              <MdDownload className="mr-2 w-5 h-5" />
              Download for Windows (.exe)
            </Button>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-2xl border-white/10 hover:bg-white/5 hover:text-white">
                Or use Billmensor Online <MdArrowForward className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 mt-10 text-sm text-slate-500"
          >
            <span className="flex items-center gap-2">
              <span className="font-bold text-white">v1.0.0</span>
            </span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span>~100MB</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span>Windows 10+</span>
          </motion.div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-20 border-y border-white/5 bg-slate-950/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">System Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/30">
              <h3 className="font-bold mb-4 text-blue-400">Minimum</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-400 w-4 h-4 shrink-0" />
                  Windows 10 (64-bit)
                </li>
                <li className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-400 w-4 h-4 shrink-0" />
                  4GB RAM
                </li>
                <li className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-400 w-4 h-4 shrink-0" />
                  200MB disk space
                </li>
                <li className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-400 w-4 h-4 shrink-0" />
                  Internet connection (for initial setup)
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/30">
              <h3 className="font-bold mb-4 text-purple-400">Recommended</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-400 w-4 h-4 shrink-0" />
                  Windows 11 (64-bit)
                </li>
                <li className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-400 w-4 h-4 shrink-0" />
                  8GB RAM
                </li>
                <li className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-400 w-4 h-4 shrink-0" />
                  500MB disk space
                </li>
                <li className="flex items-center gap-3">
                  <MdCheckCircle className="text-green-400 w-4 h-4 shrink-0" />
                  SSD for better performance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Desktop App Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <MdComputer className="w-6 h-6 text-blue-400" />,
                title: "Offline Access",
                desc: "Use Billmensor without internet. Your data stays on your machine."
              },
              {
                icon: <MdCloud className="w-6 h-6 text-purple-400" />,
                title: "Optional Cloud Backup",
                desc: "Upgrade to cloud backup for data sync across devices."
              },
              {
                icon: <MdCheckCircle className="w-6 h-6 text-green-400" />,
                title: "Full Feature Set",
                desc: "All billing features included. No limitations compared to web version."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-6 rounded-3xl border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
              >
                <div className="mb-4 p-3 w-fit rounded-2xl bg-slate-950 border border-white/5">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t border-white/5 bg-slate-950/30">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-white/5 bg-slate-900/30"
              >
                <h3 className="font-bold mb-2">{faq.question}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-400 mb-8">Download the desktop app or use Billmensor online.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard/settings/billing">
              <Button size="lg" className="h-12 px-6 bg-blue-600 hover:bg-blue-500 rounded-2xl">
                <MdCloud className="mr-2 w-5 h-5" />
                View Cloud Backup Plans
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="h-12 px-6 rounded-2xl border-white/10 hover:bg-white/5 hover:text-white">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 text-blue-500">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">B</div>
            <span className="text-xl font-bold">Billmensor</span>
          </div>
          <p className="text-slate-500 text-sm">Crafted with precision for modern Indian entrepreneurs.</p>
        </div>
      </footer>
    </div>
  );
}
