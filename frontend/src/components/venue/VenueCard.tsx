import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Card, CardContent, Typography, Box, Chip, Button, Rating } from '@mui/material';
import { formatPrice } from '@/lib/utils';
import { Venue } from '@/types';

interface Props { venue: Venue; onBook?: (id: number) => void; }

const VenueCard: React.FC<Props> = ({ venue, onBook }) => {
  const sMap: Record<string,{label:string;color:any;icon:string}> = {
    available:{label:'آزاد',color:'success',icon:'mdi:circle-outline'},
    busy:{label:'پر',color:'error',icon:'mdi:circle'},
    maintenance:{label:'تعمیرات',color:'warning',icon:'mdi:alert-circle'},
  };
  const si = sMap[venue.status]||{label:venue.status,color:'default',icon:'mdi:help-circle'};
  const am: string[] = typeof venue.amenities==='string'?JSON.parse(venue.amenities):venue.amenities as string[];
  const imgs: string[] = typeof venue.images==='string'?JSON.parse(venue.images):venue.images as string[];
  const img = imgs?.[0]||'/placeholder-venue.jpg';

  return (
    <motion.div whileHover={{y:-8}} transition={{duration:0.3}}>
      <Card sx={{borderRadius:3,overflow:'hidden',height:'100%',display:'flex',flexDirection:'column',border:'1px solid rgba(0,0,0,0.06)',boxShadow:'0 4px 20px rgba(0,0,0,0.06)','&:hover':{boxShadow:12,transform:'translateY(-8px)'}}}>
        <Box sx={{position:'relative',height:220,overflow:'hidden'}}>
          <img src={img} alt={venue.name} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.6s'}}
            onMouseEnter={(e)=>{(e.target as HTMLImageElement).style.transform='scale(1.1)';}}
            onMouseLeave={(e)=>{(e.target as HTMLImageElement).style.transform='scale(1)';}} />
          <Box sx={{position:'absolute',bottom:0,left:0,right:0,height:'60%',background:'linear-gradient(transparent, rgba(0,0,0,0.7))'}} />
          <Chip icon={<Icon icon={si.icon} className="h-3 w-3" />} label={si.label} color={si.color} size="small"
            sx={{position:'absolute',top:12,right:12,borderRadius:'10px',bgcolor:'rgba(255,255,255,0.9)',backdropFilter:'blur(8px)'}} />
          <Box sx={{position:'absolute',top:12,left:12,bgcolor:'rgba(0,0,0,0.6)',backdropFilter:'blur(8px)',borderRadius:'10px',px:1.5,py:0.5}}>
            <Typography variant="caption" sx={{color:'white',fontWeight:700}}>{formatPrice(venue.price)}</Typography>
          </Box>
          <Box sx={{position:'absolute',bottom:16,left:16,right:16}}>
            <Typography variant="h6" sx={{color:'white',fontWeight:700,fontSize:'1.1rem',textShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>{venue.name}</Typography>
          </Box>
        </Box>
        <CardContent sx={{p:2.5,pt:2,flex:1,display:'flex',flexDirection:'column',gap:1.5}}>
          <Box sx={{display:'flex',alignItems:'center',gap:1}}>
            <Icon icon="mdi:map-marker-radius" className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <Typography variant="body2" sx={{color:'text.secondary',fontSize:'0.85rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{venue.address}</Typography>
          </Box>
          <Box sx={{display:'flex',alignItems:'center',gap:0.75}}>
            <Rating value={venue.rating||4} precision={0.5} size="small" readOnly />
            <Typography variant="caption" sx={{color:'text.secondary',fontWeight:500}}>{venue.rating||4} از ۵</Typography>
          </Box>
          {am&&am.length>0&&(
            <Box sx={{display:'flex',flexWrap:'wrap',gap:0.5}}>
              {am.slice(0,4).map((a,i)=>(
                <Chip key={i} label={a} size="small" variant="outlined"
                  sx={{borderRadius:'8px',fontSize:'0.7rem',height:'24px',borderColor:'rgba(37,99,235,0.15)',color:'primary.main','& .MuiChip-label':{px:1}}} />
              ))}
              {am.length>4&&<Chip label={`+${am.length-4}`} size="small"
                sx={{borderRadius:'8px',fontSize:'0.7rem',height:'24px',bgcolor:'primary.main',color:'white'}} />}
            </Box>
          )}
          <Box sx={{mt:'auto',pt:1.5,borderTop:'1px solid rgba(0,0,0,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <Box>
              <Typography variant="caption" sx={{color:'text.secondary',display:'block'}}>قیمت هر جلسه</Typography>
              <Typography variant="h6" sx={{fontWeight:800,color:'primary.main',fontSize:'1.1rem'}}>{formatPrice(venue.price)}</Typography>
            </Box>
            <Button variant="contained" onClick={()=>onBook?.(venue.id)}
              sx={{borderRadius:'12px',textTransform:'none',px:2.5,py:1,background:'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',boxShadow:'0 4px 15px rgba(37,99,235,0.3)',fontWeight:600,fontSize:'0.9rem','&:hover':{background:'linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)',boxShadow:'0 6px 20px rgba(37,99,235,0.4)'}}}>
              <Icon icon="mdi:calendar-check" className="h-4 w-4 ml-1" />رزرو
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VenueCard;