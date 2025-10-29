import React from 'react';
const Frameworks: React.FC = () => {
  const frontendFrameworks = [
    {
      name: 'React',
      url: 'https://reactjs.org/',
      category: 'Frontend',
    },
    {
      name: 'TypeScript',
      url: 'https://www.typescriptlang.org/',
      category: 'Frontend & Backend',
    },
    {
      name: 'React Router',
      url: 'https://reactrouter.com/',
      category: 'Frontend',
    },
    {
      name: 'Redux Toolkit',
      url: 'https://redux-toolkit.js.org/',
      category: 'Frontend',
    },
    {
      name: 'Tailwind CSS',
      url: 'https://tailwindcss.com/',
      category: 'Frontend',
    },
    {
      name: 'Material UI',
      url: 'https://mui.com/',
      category: 'Frontend',
    },
    {
      name: 'TinyMCE',
      url: 'https://www.tiny.cloud/',
      category: 'Frontend',
    },
    {
      name: 'Figma',
      url: 'https://www.figma.com/',
      category: 'Design',
    },
    {
      name: 'Vite',
      url: 'https://vitejs.dev/',
      category: 'Build Tool',
    },
  ];

  const backendFrameworks = [
    {
      name: 'Node.js',
      url: 'https://nodejs.org/',
      category: 'Backend',
    },
    {
      name: 'Express',
      url: 'https://expressjs.com/',
      category: 'Backend',
    },
    {
      name: 'MongoDB',
      url: 'https://www.mongodb.com/',
      category: 'Database',
    },
    {
      name: 'Mongoose',
      url: 'https://mongoosejs.com/',
      category: 'Backend',
    },
    {
      name: 'Bcrypt',
      url: 'https://github.com/kelektiv/node.bcrypt.js',
      category: 'Security',
    },
    {
      name: 'Nodemailer',
      url: 'https://nodemailer.com/',
      category: 'Backend',
    },
    {
      name: 'Redis',
      url: 'https://redis.io/',
      category: 'Database/Cache',
    },
  ];

  // References
  const references = [
    {
      url: 'https://www.youtube.com/watch?v=MKaLJyPOS4U&t=299s',
      title: 'YouTube Tutorial 1'
    },
    {
      url: 'https://www.youtube.com/watch?v=g0db5kA4BfQ',
      title: 'YouTube Tutorial 2'
    },
    {
      url: 'https://www.youtube.com/watch?v=grxNze3hjAQ',
      title: 'YouTube Tutorial 3'
    }
  ];

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Tech Stack</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            MP Jobs is built using modern frameworks and libraries to provide a seamless experience for job seekers and employers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Frontend Technologies</h2>
            <ul className="list-disc pl-6 space-y-3">
              {frontendFrameworks.map((framework, index) => (
                <li key={index} className="text-gray-700">
                  <span className="font-medium">{framework.name}</span>
                  <span className="ml-2 text-sm">
                    <a 
                      href={framework.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#B8A361] hover:text-[#a08c4a] hover:underline"
                    >
                      Learn more
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>

       
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">Backend Technologies</h2>
            <ul className="list-disc pl-6 space-y-3">
              {backendFrameworks.map((framework, index) => (
                <li key={index} className="text-gray-700">
                  <span className="font-medium">{framework.name}</span>
                  <span className="ml-2 text-sm">
                   <a 
                  href={framework.url} 
                   target="_blank" 
                    rel="noopener noreferrer"
                   className="text-[#B8A361] hover:text-[#a08c4a] hover:underline"
                    >
                      Learn more
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      
        <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">References</h2>
        <ul className="list-disc pl-6 space-y-3">
            {references.map((reference, index) => (
              <li key={index} className="text-gray-700">
               <a 
                   href={reference.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="text-[#B8A361] hover:text-[#a08c4a] hover:underline"
                >
                  {reference.url}
               </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};


export default Frameworks; 