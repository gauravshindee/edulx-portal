import user2 from "/src/assets/images/profile/user-2.jpg";
import user3 from "/src/assets/images/profile/user-3.jpg";
import img1 from "/src/assets/images/blog/blog-img1.jpg";
import img2 from "/src/assets/images/blog/blog-img2.jpg";
import img3 from "/src/assets/images/blog/blog-img3.jpg";
import { Badge } from "flowbite-react";
import { TbPoint }   from "react-icons/tb";
import { Icon } from "@iconify/react";
import { Link } from "react-router";


const BlogCardsData = [
  {
    avatar: user2,
    coveravatar: img1,
    read: "5 min Read", // Adjusted read time for more realistic blog content
    title: "Top Universities for Masters in Computer Science Abroad",
    category: "Academics",
    name: "Edulx Insights Team", // More appropriate name for blog content
    view: "15,200", // Updated view count for relevance
    comments: "45",
    time: "Wed, Jun 19", // Updated date to be current
    url:'/blog/top-universities-computer-science' // Example URL structure
  },
  {
    avatar: user2,
    coveravatar: img2,
    read: "7 min Read",
    title: "Navigating Visa Applications: A Step-by-Step Guide for Students",
    category: "Visa & Immigration",
    name: "Edulx Experts",
    view: "12,800",
    comments: "62",
    time: "Mon, Jun 17",
    url:'/blog/visa-application-guide'
  },
  {
    avatar: user3,
    coveravatar: img3,
    read: "4 min Read",
    title: "Scholarship Opportunities for International Students in Europe",
    category: "Funding",
    name: "Edulx Scholarship Advisors",
    view: "10,500",
    comments: "30",
    time: "Fri, Jun 14",
    url:'/blog/scholarships-europe'
  },
  // Adding more diverse study abroad topics
  {
    avatar: user2,
    coveravatar: img1, // Reusing images for now, these would be unique in a real app
    read: "6 min Read",
    title: "Choosing the Right Study Destination: USA vs. Canada",
    category: "Destinations",
    name: "Edulx Counselors",
    view: "11,100",
    comments: "50",
    time: "Tue, Jun 11",
    url:'/blog/usa-vs-canada-study'
  },
  {
    avatar: user3,
    coveravatar: img2,
    read: "3 min Read",
    title: "Preparing for IELTS/TOEFL: Essential Tips for Success",
    category: "Test Prep",
    name: "Edulx Education Hub",
    view: "9,900",
    comments: "25",
    time: "Sun, Jun 09",
    url:'/blog/ielts-toefl-tips'
  },
  {
    avatar: user2,
    coveravatar: img3,
    read: "8 min Read",
    title: "Post-Study Work Permits: Opportunities After Graduation Abroad",
    category: "Career",
    name: "Edulx Career Team",
    view: "14,000",
    comments: "70",
    time: "Thu, Jun 06",
    url:'/blog/post-study-work-permits'
  },
];

const BlogCards = () => {
  return (
    <>
      <div className="grid grid-cols-12 gap-30"> {/* Gap-30 is a TailwindCSS custom spacing or an error */}
        {BlogCardsData.map((item, i) => (
          <div className="lg:col-span-4 col-span-12" key={i}>
            <Link to={item.url} className="group">
            <div className="rounded-xl dark:shadow-dark-md shadow-md bg-white dark:bg-darkgray p-0 relative w-full break-words overflow-hidden">
                <div className="relative">
                  <img src={item.coveravatar} alt="Edulx" />
                  <Badge
                    color={"muted"}
                    className="absolute bottom-5 end-5 font-semibold rounded-sm bg-muted"
                  >
                    {item.read}
                  </Badge>
                </div>

                <div className="px-6 pb-6">
                  <img
                    src={item.avatar}
                    className="h-10 w-10 rounded-full -mt-7 relative z-1"
                    alt="user"
                  />
                  <Badge color={"muted"} className="mt-6">
                    {item.category}
                  </Badge>
                  <h5 className="text-lg my-6 group-hover:text-primary line-clamp-2">{item.title}</h5>
                  <div className="flex">
                    <div className="flex gap-2 me-6 items-center">
                    <Icon icon="solar:eye-outline" height="18" className="text-dark" />
                      <span className="text-sm text-darklink">{item.view}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                    <Icon icon="solar:chat-line-outline" height="18" className="text-dark" />
                      <span className="text-sm text-darklink">{item.comments}</span> {/* Changed to item.comments */}
                    </div>
                    <div className="flex gap-1 items-center ms-auto">
                      <TbPoint
                        size={15}
                        className="text-dark"
                      />{" "}
                      <span className="text-sm text-darklink">{item.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
};

export default BlogCards;