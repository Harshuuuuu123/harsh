import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    title: "Advocate, Delhi High Court",
    quote:
      "This platform has revolutionized how I handle public notices for my clients. The verification process is seamless and the search functionality is incredibly powerful.",
  },
  {
    name: "Rajesh Kumar",
    title: "Property Investor",
    quote:
      "I've been able to stay informed about all property‑related notices in my area. The objection process is straightforward and has saved me from potential legal issues.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="max-w-7xl mx-auto py-16 px-4" id="testimonials">
      <h2 className="text-3xl font-serif text-center mb-2">
        What Our Users Say
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Trusted by lawyers and citizens across India for reliable legal notice
        management
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {testimonials.map((t, idx) => (
          <div key={idx} className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-semibold text-gray-600">
                {t.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{t.name}</h3>
                <p className="text-sm text-gray-500">{t.title}</p>
              </div>
            </div>
            <p className="text-gray-700 italic mb-4">"{t.quote}"</p>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
