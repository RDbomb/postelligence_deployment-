"use client";

import { useEffect, useState } from "react";
import { 
  Send, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  LifeBuoy, 
  Layers, 
  PlusCircle, 
  X,
  Upload,
  MessageSquare,
  Sparkles,
  Paperclip,
  Check,
  Phone,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  email?: string | null;
}

export default function SupportClient({ user }: { user: User }) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"submit" | "list">("submit");
  
  // Submit Form States
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // Base64 data urls
  const [submitting, setSubmitting] = useState(false);

  // Tickets List States
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [userReplyText, setUserReplyText] = useState("");
  const [fetchingTickets, setFetchingTickets] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const [isTypingSent, setIsTypingSent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [chatEnabled, setChatEnabled] = useState(true);

  // Toast notifications
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchMyTickets();
    const interval = setInterval(() => {
      fetchMyTickets();
    }, 2000); // Poll every 2 seconds for seamless updates!
    return () => {
      clearInterval(interval);
    };
  }, []);

  const sendTypingStatus = async (ticketId: string, isTyping: boolean) => {
    if (String(ticketId).startsWith("TCK-MOCK-")) return;
    try {
      await fetch("/api/support/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, role: "user", isTyping })
      });
    } catch (e) {
      console.warn("Failed to update user typing indicator", e);
    }
  };

  const handleUserTyping = (text: string) => {
    setUserReplyText(text);
    if (!selectedTicketId) return;

    if (text.length > 0) {
      if (!isTypingSent) {
        setIsTypingSent(true);
        sendTypingStatus(selectedTicketId, true);
      }
      if (typingTimeout) clearTimeout(typingTimeout);
      const t = setTimeout(() => {
        sendTypingStatus(selectedTicketId, false);
        setIsTypingSent(false);
      }, 3000);
      setTypingTimeout(t);
    } else {
      if (typingTimeout) clearTimeout(typingTimeout);
      sendTypingStatus(selectedTicketId, false);
      setIsTypingSent(false);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMyTickets = async () => {
    setFetchingTickets(true);
    try {
      // Fetch system settings for Chat Support Enabled via API
      try {
        const res = await fetch("/api/support/config");
        if (res.ok) {
          const config = await res.json();
          if (config && typeof config.chatSupportEnabled === "boolean") {
            setChatEnabled(config.chatSupportEnabled);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve system chat setting via API:", err);
      }

      const { data: dbData, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setMyTickets(dbData || []);
    } catch (err) {
      console.warn("Could not query support_tickets from Supabase. Falling back to local storage.", err);
      // Fetch from local fallback
      const localData = localStorage.getItem(`local_tickets_${user.id}`);
      if (localData) {
        setMyTickets(JSON.parse(localData));
      }
    } finally {
      setFetchingTickets(false);
    }
  };

  // Convert files to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        showToast("Only image files are supported.", "error");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSelectedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitting(true);
    const newMessages = [
      { sender: "user", text: description, time: new Date().toLocaleString() }
    ];

    try {
      const { data: dbTicket, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject,
          description,
          status: "open",
          images: selectedImages,
          messages: newMessages
        })
        .select()
        .single();
      
      if (error) throw error;
      showToast("Support ticket submitted successfully!");
      await fetchMyTickets();
      
      // Reset form
      setSubject("");
      setDescription("");
      setSelectedImages([]);
      setActiveTab("list");
    } catch (err: any) {
      console.warn("Writing to database failed, storing locally to fallback storage", err);
      
      // Fallback
      const localTickets = JSON.parse(localStorage.getItem(`local_tickets_${user.id}`) || "[]");
      const fallbackTicket = {
        id: `TCK-MOCK-${Math.floor(1000 + Math.random() * 9000)}`,
        user_id: user.id,
        subject,
        description,
        status: "open",
        images: selectedImages,
        messages: newMessages,
        created_at: new Date().toISOString(),
        updated: new Date().toISOString().split("T")[0]
      };
      
      const updatedList = [fallbackTicket, ...localTickets];
      localStorage.setItem(`local_tickets_${user.id}`, JSON.stringify(updatedList));
      setMyTickets(updatedList);
      showToast("Submitted successfully! (Note: run database migration to sync data)", "success");
      
      setSubject("");
      setDescription("");
      setSelectedImages([]);
      setActiveTab("list");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendUserReply = async (ticketId: string) => {
    if (!userReplyText.trim()) return;
    const activeTicket = myTickets.find((t) => t.id === ticketId);
    if (!activeTicket || activeTicket.status === "resolved") return;

    if (typingTimeout) clearTimeout(typingTimeout);
    sendTypingStatus(ticketId, false);

    const newReply = { sender: "user", text: userReplyText, time: new Date().toLocaleString() };
    const updatedMessages = [...(activeTicket.messages || []), newReply];

    // Check if it's a mock fallback ticket
    if (String(ticketId).startsWith("TCK-MOCK-")) {
      const updatedList = myTickets.map((t) => {
        if (t.id === ticketId) {
          return { ...t, messages: updatedMessages, status: "open" };
        }
        return t;
      });
      localStorage.setItem(`local_tickets_${user.id}`, JSON.stringify(updatedList));
      setMyTickets(updatedList);
      setUserReplyText("");
      showToast("Reply saved.");
      return;
    }

    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          messages: updatedMessages,
          status: "open" // Reopen ticket on user reply activity
        })
        .eq("id", ticketId);
      
      if (error) throw error;
      setUserReplyText("");
      await fetchMyTickets();
      showToast("Reply sent successfully.");
    } catch (err) {
      console.warn("Could not save user reply to database, updating local fallback.", err);
      const updatedList = myTickets.map((t) => {
        if (t.id === ticketId) {
          return { ...t, messages: updatedMessages, status: "open" };
        }
        return t;
      });
      localStorage.setItem(`local_tickets_${user.id}`, JSON.stringify(updatedList));
      setMyTickets(updatedList);
      setUserReplyText("");
    }
  };

  const selectedTicket = myTickets.find((t) => t.id === selectedTicketId);

  const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-rose-50 border-rose-200 text-rose-700" },
    in_progress: { label: "In Progress", className: "bg-amber-50 border-amber-200 text-amber-700" },
    resolved: { label: "Resolved", className: "bg-emerald-50 border-emerald-200 text-emerald-700" },
    closed: { label: "Closed", className: "bg-slate-100 border-slate-200 text-slate-500" }
  };

  if (!chatEnabled) {
    return (
      <div className="relative min-h-screen">
        {toast && (
          <div
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-xl border backdrop-blur-md transition-all duration-300 ${
              toast.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {toast.msg}
          </div>
        )}

        <div className="mx-auto max-w-3xl space-y-6">
          {/* Get in Touch Card */}
          <div className="bg-white border border-slate-200/80 p-8 rounded-3xl shadow-sm space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2f7867] leading-none">Contact Us</p>
              <h2 className="text-lg font-black text-slate-800 mt-2">Get in Touch</h2>
              <p className="text-xs text-slate-400 mt-1">
                Postelligence support chat is currently offline. You can reach out directly via our official channels:
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Email Info */}
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4 leading-normal">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700 leading-none">Email Support</p>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-bold">support@postelligence.app</p>
                </div>
              </div>

              {/* Phone Info */}
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4 leading-normal">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700 leading-none">Call Support</p>
                  <p className="text-[11px] text-slate-500 mt-1.5 font-bold">+1 (800) 555-0199</p>
                </div>
              </div>

              {/* Clock Info */}
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4 leading-normal">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700 leading-none">Support Hours</p>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-normal font-bold">Mon - Fri, 9:00 AM - 6:00 PM EST</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white border border-slate-200/80 p-8 rounded-3xl shadow-sm space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#2f7867] leading-none">Help & Documentation</p>
              <h2 className="text-lg font-black text-slate-800 mt-2">Frequently Asked Questions</h2>
              <p className="text-xs text-slate-400 mt-1">
                Have questions about Postelligence? Browse our most common queries below:
              </p>
            </div>
            <div className="space-y-3 pt-2">
              {[
                {
                  question: "Why is my scheduled post stuck in 'Pending'?",
                  answer: "Posts remain in 'Pending' until their exact scheduled execution time. Check your automation settings to make sure your scheduler engine is enabled, and verify that you have checked at least one active channel."
                },
                {
                  question: "How do I link a new social media channel?",
                  answer: "Go to your sidebar menu, click 'Channels' or navigate to Workspace settings. Click on the icon of the platform you wish to connect and authenticate via the popup window."
                },
                {
                  question: "What happens if a drafted caption is too long?",
                  answer: "Postelligence has a hard character limit of 500 characters built into the AI generation prompt to guarantee compatibility with Meta Threads and Bluesky guidelines. If you write manually, a character count indicator will alert you when you exceed the limit."
                },
                {
                  question: "How does manual approval mode differ from auto-publish?",
                  answer: "In manual approval mode, new drafts will not be posted automatically. Instead, Postelligence creates a queue entry and alerts you by email. You can approve or modify them from either the approval email link or your dashboard."
                },
                {
                  question: "How do I upgrade my Postelligence plan?",
                  answer: "Navigate to Workspace Settings -> Plans & Billing from the sidebar. You can dynamically toggle between Core, Pro, and Agency subscription tiers."
                },
                {
                  question: "Why did my auto-publish flow to Instagram fail?",
                  answer: "Make sure your target Instagram account is a Professional (Business or Creator) account, and that it is linked to a Facebook Page. Personal Instagram accounts are not supported by the Meta API for automated publishing."
                },
                {
                  question: "How do I set the target posting time and timezone?",
                  answer: "Navigate to the Automation page inside the sidebar configuration block. You can specify a local posting timezone and target hours. Postelligence automatically schedules publications accordingly."
                }
              ].map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20">
                    <button
                      type="button"
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-50/50 transition"
                    >
                      <span>{faq.question}</span>
                      <span className="text-slate-400 font-bold ml-2">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-2 text-xs md:text-[13px] leading-relaxed text-slate-600 font-medium border-t border-slate-50/80 bg-white/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-xl border backdrop-blur-md transition-all duration-300 ${
            toast.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast.msg}
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-5">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#1f2528]/8 pb-3">
          <button
            onClick={() => { setActiveTab("submit"); setSelectedTicketId(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "submit"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            Submit New Ticket
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
              activeTab === "list"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            My Active Tickets ({myTickets.length})
          </button>
        </div>

        {/* TAB: SUBMIT TICKET FORM */}
        {activeTab === "submit" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            
            {/* Left Column: Form */}
            <div className="lg:col-span-3 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#2f7867]/80 leading-none">Support Center</p>
                <h2 className="text-md font-black text-slate-800 mt-1">Submit Support Request</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  Need help? Submit a ticket and attach screenshots, and our team will get back shortly.
                </p>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Ticket Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. LinkedIn API connection throws token expiration error"
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/30 px-3.5 py-2 text-xs font-bold text-[#1f2528] focus:bg-white focus:border-indigo-500 focus:outline-none transition shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Detailed Description</label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain your query, steps to reproduce, or issue logs..."
                    className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50/30 p-3 text-xs font-bold leading-normal text-[#1f2528] focus:bg-white focus:border-indigo-500 focus:outline-none transition shadow-sm resize-none"
                  />
                </div>

                {/* Attach Multiple Images Dropzone */}
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Attach Screenshots (Multiple Images)</label>
                  
                  {/* Image Previews grid */}
                  {selectedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedImages.map((img, idx) => (
                        <div key={idx} className="relative h-12 w-12 group rounded-lg overflow-hidden border border-slate-250/70 shadow-sm">
                          <img src={img} alt="Attachment Preview" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeSelectedImage(idx)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-155"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 relative flex flex-col items-center justify-center border border-dashed border-slate-250 hover:border-indigo-400/80 rounded-xl p-4 bg-slate-50/30 transition text-center">
                    <Upload className="h-4 w-4 text-slate-400 mb-1" />
                    <p className="text-[9px] font-bold text-slate-500 leading-none">Drag images or click to upload screenshots</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !description.trim()}
                  className="w-full mt-3 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 transition shadow flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Submit Support Request
                </button>
              </form>
            </div>

            {/* Right Column: Contact Details */}
            <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-650 leading-none">Contact Us</p>
                <h2 className="text-md font-black text-slate-800 mt-1">Get in Touch</h2>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                  Have an urgent question? Reach out directly via our official support channels.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Email Info */}
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3.5 leading-normal">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 leading-none">Email Support</p>
                    <p className="text-[11px] text-slate-500 mt-1.5 font-bold">support@postelligence.app</p>
                  </div>
                </div>

                {/* Phone Info */}
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3.5 leading-normal">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 leading-none">Call Support</p>
                    <p className="text-[11px] text-slate-500 mt-1.5 font-bold">+1 (800) 555-0199</p>
                  </div>
                </div>

                {/* Clock Info */}
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-3.5 leading-normal">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-700 leading-none">Support Hours</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-normal font-bold">Mon - Fri, 9:00 AM - 6:00 PM EST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#2f7867] leading-none">Help & Documentation</p>
                <h2 className="text-md font-black text-slate-800 mt-1">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    question: "Why is my scheduled post stuck in 'Pending'?",
                    answer: "Posts remain in 'Pending' until their exact scheduled execution time. Check your automation settings to make sure your scheduler engine is enabled, and verify that you have checked at least one active channel."
                  },
                  {
                    question: "How do I link a new social media channel?",
                    answer: "Go to your sidebar menu, click 'Channels' or navigate to Workspace settings. Click on the icon of the platform you wish to connect and authenticate via the popup window."
                  },
                  {
                    question: "What happens if a drafted caption is too long?",
                    answer: "Postelligence has a hard character limit of 500 characters built into the AI generation prompt to guarantee compatibility with Meta Threads and Bluesky guidelines. If you write manually, a character count indicator will alert you when you exceed the limit."
                  },
                  {
                    question: "How does manual approval mode differ from auto-publish?",
                    answer: "In manual approval mode, new drafts will not be posted automatically. Instead, Postelligence creates a queue entry and alerts you by email. You can approve or modify them from either the approval email link or your dashboard."
                  },
                  {
                    question: "How do I upgrade my Postelligence plan?",
                    answer: "Navigate to Workspace Settings -> Plans & Billing from the sidebar. You can dynamically toggle between Core, Pro, and Agency subscription tiers."
                  },
                  {
                    question: "Why did my auto-publish flow to Instagram fail?",
                    answer: "Make sure your target Instagram account is a Professional (Business or Creator) account, and that it is linked to a Facebook Page. Personal Instagram accounts are not supported by the Meta API for automated publishing."
                  },
                  {
                    question: "How do I set the target posting time and timezone?",
                    answer: "Navigate to the Automation page inside the sidebar configuration block. You can specify a local posting timezone and target hours. Postelligence automatically schedules publications accordingly."
                  }
                ].map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/20">
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full text-left px-5 py-3.5 flex items-center justify-between text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-50/50 transition"
                      >
                        <span>{faq.question}</span>
                        <span className="text-slate-400 font-bold ml-2">{isOpen ? "−" : "+"}</span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 pt-2 text-xs md:text-[13px] leading-relaxed text-slate-600 font-medium border-t border-slate-50/80 bg-white/40">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB: MY ACTIVE TICKETS LIST */}
        {activeTab === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Left Tickets Panel */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-4 space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">My Tickets</h3>
              <div className="divide-y divide-slate-100 h-[450px] overflow-y-auto pr-1">
                {myTickets.map((t) => {
                  const statusVal = STATUS_STYLES[t.status] || { label: t.status, className: "bg-slate-50 text-slate-500" };
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-2 mt-1.5 first:mt-0 ${
                        selectedTicketId === t.id ? "bg-slate-50 border border-slate-250/70" : "hover:bg-slate-50/50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-indigo-650 truncate max-w-[120px]">{t.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${statusVal.className}`}>
                          {statusVal.label}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-700 leading-snug line-clamp-2">{t.subject}</h4>
                    </button>
                  );
                })}
                {myTickets.length === 0 && (
                  <p className="text-center text-xs text-slate-400 italic py-12">No active tickets submitted yet.</p>
                )}
              </div>
            </div>

            {/* Right Conversations Thread Panel */}
            <div className="md:col-span-3 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 flex flex-col justify-between min-h-[500px]">
              {selectedTicket ? (
                <div className="flex flex-col h-full justify-between leading-normal">
                  <div className="space-y-4">
                    {/* Header info */}
                    <div className="border-b border-slate-100 pb-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-800 leading-snug">{selectedTicket.subject}</h2>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide border ${STATUS_STYLES[selectedTicket.status]?.className}`}>
                          {STATUS_STYLES[selectedTicket.status]?.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-400 font-bold">
                        <span className="truncate max-w-[150px]">ID: {selectedTicket.id}</span>
                      </div>
                    </div>

                    {/* Screenshot attachments thumbnails */}
                    {selectedTicket.images && selectedTicket.images.length > 0 && (
                      <div className="space-y-1.5 pb-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Attached screenshots ({selectedTicket.images.length})</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedTicket.images.map((img: string, idx: number) => (
                            <a key={idx} href={img} target="_blank" rel="noreferrer" className="relative group">
                              <img
                                src={img}
                                alt={`Attachment Screenshot ${idx + 1}`}
                                className="h-12 w-12 object-cover rounded-xl border border-slate-200 shadow-sm transition hover:scale-105"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Messages Thread list */}
                    <div className="space-y-3 h-[240px] overflow-y-auto pr-1 border-t border-slate-50 pt-3">
                      {selectedTicket.messages?.map((m: any, idx: number) => {
                        const isUser = m.sender === "user";
                        return (
                          <div key={idx} className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}>
                            <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed border ${
                              isUser
                                ? "bg-indigo-50 border-indigo-150 text-indigo-850 rounded-tr-none"
                                : "bg-slate-50 border-slate-200 text-slate-700 rounded-tl-none"
                            }`}>
                              <p>{m.text}</p>
                              <span className="block text-[8px] text-slate-400 mt-1 text-right font-medium leading-none">{m.time}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* typing indicator */}
                      {selectedTicket.typing_status?.admin && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold pl-2 py-1 select-none animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-450 animate-bounce delay-0" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-450 animate-bounce [animation-delay:0.2s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-450 animate-bounce [animation-delay:0.4s]" />
                          <span className="ml-1 text-[9px] text-slate-400 italic">Support staff is typing...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Send User reply field */}
                  <div className="border-t border-slate-100 pt-4 flex gap-2 items-center">
                    <input
                      type="text"
                      value={userReplyText}
                      onChange={(e) => handleUserTyping(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && selectedTicket.status !== "resolved") handleSendUserReply(selectedTicket.id);
                      }}
                      placeholder={selectedTicket.status === "resolved" ? "This ticket has been resolved." : "Write response message and hit Send..."}
                      disabled={selectedTicket.status === "resolved"}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs font-bold text-[#1f2528] focus:bg-white focus:border-indigo-500 focus:outline-none transition shadow-sm disabled:opacity-50"
                    />
                    <button
                      onClick={() => handleSendUserReply(selectedTicket.id)}
                      disabled={selectedTicket.status === "resolved" || !userReplyText.trim()}
                      className="p-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white transition flex items-center justify-center shadow disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-12">
                  <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                    <LifeBuoy className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-650 uppercase tracking-wide">No Ticket Selected</h4>
                    <p className="text-[10px] text-slate-400 font-bold max-w-[200px] mt-1 leading-normal">
                      Select an active support ticket on the left list to view updates, chat with replies, and track resolutions.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
